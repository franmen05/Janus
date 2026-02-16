package com.janus.document.application;

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
import com.janus.shared.infrastructure.exception.NotFoundException;
import com.janus.user.domain.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.io.InputStream;
import java.util.List;
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
                           String mimeType, long fileSize, String username) {
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

        userRepository.findByUsername(username).ifPresent(u -> version.uploadedBy = u);

        documentVersionRepository.persist(version);

        document.status = validationService.determineStatus(mimeType, fileSize);

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
    public void softDelete(Long documentId) {
        var document = findById(documentId);
        document.active = false;
    }

    public DocumentCompletenessService.CompletenessResult getCompleteness(Long operationId) {
        operationService.findById(operationId);
        return completenessService.calculate(operationId);
    }
}
