package com.janus.document.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.document.domain.model.Document;
import com.janus.document.domain.model.DocumentStatus;
import com.janus.document.domain.model.DocumentType;
import com.janus.document.domain.model.DocumentVersion;
import com.janus.document.domain.repository.DocumentRepository;
import com.janus.document.domain.repository.DocumentVersionRepository;
import com.janus.document.domain.service.DocumentCompletenessService;
import com.janus.document.domain.service.DocumentValidationService;
import com.janus.document.infrastructure.storage.StorageService;
import com.janus.operation.application.OperationService;
import com.janus.operation.domain.service.StatusTransitionService;
import com.janus.shared.infrastructure.exception.BusinessException;
import com.janus.shared.infrastructure.exception.NotFoundException;
import com.janus.shared.infrastructure.util.JsonUtil;
import com.janus.user.domain.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class DocumentService {

    @Inject
    DocumentRepository documentRepository;

    @Inject
    DocumentVersionRepository documentVersionRepository;

    @Inject
    OperationService operationService;

    @Inject
    UserRepository userRepository;

    @Inject
    StorageService storageService;

    @Inject
    DocumentValidationService validationService;

    @Inject
    DocumentCompletenessService completenessService;

    @Inject
    StatusTransitionService statusTransitionService;

    @Inject
    Event<AuditEvent> auditEvent;

    public List<Document> findByOperationId(Long operationId) {
        return documentRepository.findByOperationId(operationId);
    }

    public Document findById(Long id) {
        return documentRepository.findByIdOptional(id)
                .filter(d -> d.active)
                .orElseThrow(() -> new NotFoundException("Document", id));
    }

    @Transactional
    public Document upload(Long operationId, DocumentType documentType,
                           InputStream fileStream, String originalName,
                           String mimeType, long fileSize, String username,
                           String changeReason) {
        var operation = operationService.findById(operationId);

        validationService.validateFile(mimeType, fileSize);

        var document = documentRepository.findByOperationAndType(operationId, documentType)
                .orElseGet(() -> {
                    var doc = new Document();
                    doc.operation = operation;
                    doc.documentType = documentType;
                    doc.status = DocumentStatus.PENDING;
                    documentRepository.persist(doc);
                    return doc;
                });

        var storedName = UUID.randomUUID() + "_" + originalName;
        var filePath = storageService.store(fileStream, storedName, operation.referenceNumber);

        var version = new DocumentVersion();
        version.document = document;
        version.versionNumber = documentVersionRepository.getNextVersionNumber(document.id);
        version.originalName = originalName;
        version.storedName = storedName;
        version.filePath = filePath;
        version.fileSize = fileSize;
        version.mimeType = mimeType;
        version.changeReason = changeReason;

        userRepository.findByUsername(username).ifPresent(u -> version.uploadedBy = u);

        documentVersionRepository.persist(version);

        document.status = validationService.determineStatus(mimeType, fileSize);

        var auditAction = version.versionNumber > 1 ? AuditAction.DOCUMENT_REPLACED : AuditAction.UPLOAD;
        auditEvent.fire(new AuditEvent(
                username, auditAction, "Document", document.id, operationId,
                null, JsonUtil.toJson(Map.of(
                        "documentType", documentType.name(),
                        "fileName", originalName,
                        "version", version.versionNumber
                )),
                (version.versionNumber > 1 ? "Document replaced: " : "Document uploaded: ")
                        + documentType + " v" + version.versionNumber
        ));

        return document;
    }

    public List<DocumentVersion> getVersions(Long documentId) {
        findById(documentId);
        return documentVersionRepository.findByDocumentId(documentId);
    }

    public DocumentVersion getLatestVersion(Long documentId) {
        return documentVersionRepository.findLatestByDocumentId(documentId)
                .orElseThrow(() -> new NotFoundException("DocumentVersion for document", documentId));
    }

    public DocumentVersion getLatestVersionOrNull(Long documentId) {
        return documentVersionRepository.findLatestByDocumentId(documentId).orElse(null);
    }

    public DocumentVersion getVersion(Long documentId, int versionNumber) {
        findById(documentId);
        return documentVersionRepository.findByDocumentId(documentId).stream()
                .filter(v -> v.versionNumber == versionNumber)
                .findFirst()
                .orElseThrow(() -> new NotFoundException("DocumentVersion", versionNumber));
    }

    @Transactional
    public void softDelete(Long documentId, String username) {
        var document = findById(documentId);

        if (document.operation != null && statusTransitionService.isFinalStatus(document.operation.status)) {
            throw new BusinessException("Cannot delete documents from a closed or cancelled operation");
        }

        document.active = false;

        auditEvent.fire(new AuditEvent(
                username, AuditAction.DELETE, "Document", documentId,
                document.operation != null ? document.operation.id : null,
                null, null, "Document soft-deleted: " + document.documentType
        ));
    }

    public DocumentCompletenessService.CompletenessResult getCompleteness(Long operationId) {
        operationService.findById(operationId);
        return completenessService.calculate(operationId);
    }
}
