package com.janus.inspection.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.document.domain.service.DocumentValidationService;
import com.janus.document.infrastructure.storage.StorageService;
import com.janus.inspection.api.dto.CreateExpenseRequest;
import com.janus.inspection.domain.model.InspectionExpense;
import com.janus.inspection.domain.model.InspectionPhoto;
import com.janus.inspection.domain.repository.InspectionExpenseRepository;
import com.janus.inspection.domain.repository.InspectionPhotoRepository;
import com.janus.notification.application.NotificationService;
import com.janus.operation.api.dto.ChangeStatusRequest;
import com.janus.operation.application.OperationService;
import com.janus.operation.domain.model.InspectionType;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.shared.infrastructure.exception.BusinessException;
import com.janus.user.domain.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@ApplicationScoped
public class InspectionService {

    private static final Logger LOG = Logger.getLogger(InspectionService.class);

    private static final Set<OperationStatus> ALLOWED_STATUSES = Set.of(
            OperationStatus.SUBMITTED_TO_CUSTOMS,
            OperationStatus.VALUATION_REVIEW
    );

    @Inject
    OperationService operationService;

    @Inject
    InspectionPhotoRepository inspectionPhotoRepository;

    @Inject
    InspectionExpenseRepository inspectionExpenseRepository;

    @Inject
    UserRepository userRepository;

    @Inject
    StorageService storageService;

    @Inject
    DocumentValidationService documentValidationService;

    @Inject
    NotificationService notificationService;

    @Inject
    Event<AuditEvent> auditEvent;

    @ConfigProperty(name = "janus.notification.inspection-photo-email", defaultValue = "customs-team@janus.com")
    String inspectionPhotoEmail;

    @Transactional
    public void setInspectionType(Long operationId, InspectionType inspectionType, String comment, String username) {
        var operation = operationService.findById(operationId);

        if (!ALLOWED_STATUSES.contains(operation.status)) {
            throw new BusinessException(
                    "Inspection type can only be set when operation is in SUBMITTED_TO_CUSTOMS or VALUATION_REVIEW status");
        }

        operation.inspectionType = inspectionType;
        operation.inspectionSetAt = LocalDateTime.now();

        auditEvent.fire(new AuditEvent(
                username, AuditAction.UPDATE, "Operation", operation.id, operationId,
                null, null,
                "Inspection type set to " + inspectionType + (comment != null ? " - " + comment : "")
        ));

        // Flush so compliance rules can read the updated inspectionType
        operation.flush();

        // Auto-advance for EXPRESO: if status is SUBMITTED_TO_CUSTOMS, advance to VALUATION_REVIEW
        if (inspectionType == InspectionType.EXPRESO && operation.status == OperationStatus.SUBMITTED_TO_CUSTOMS) {
            operationService.changeStatus(operationId,
                    new ChangeStatusRequest(OperationStatus.VALUATION_REVIEW,
                            "Auto-advanced after EXPRESO inspection type set"),
                    username, null);
        }
    }

    @Transactional
    public InspectionPhoto uploadPhoto(Long operationId, InputStream fileStream, String originalName,
                                        String mimeType, long fileSize, String caption, String username) {
        var operation = operationService.findById(operationId);

        if (operation.inspectionType == null) {
            throw new BusinessException("Inspection type must be set before uploading photos");
        }

        if (operation.inspectionType == InspectionType.EXPRESO) {
            throw new BusinessException("Photos are not allowed for EXPRESO inspection type");
        }

        if (!ALLOWED_STATUSES.contains(operation.status)) {
            throw new BusinessException(
                    "Photos can only be uploaded when operation is in SUBMITTED_TO_CUSTOMS or VALUATION_REVIEW status");
        }

        documentValidationService.validateFile(mimeType, fileSize);

        var storedName = UUID.randomUUID() + "_" + originalName;
        var subfolder = operation.referenceNumber + "/inspection";
        var filePath = storageService.store(fileStream, storedName, subfolder);

        var photo = new InspectionPhoto();
        photo.operation = operation;
        photo.originalName = originalName;
        photo.storedName = storedName;
        photo.filePath = filePath;
        photo.fileSize = fileSize;
        photo.mimeType = mimeType;
        photo.caption = caption;

        userRepository.findByUsername(username).ifPresent(u -> photo.uploadedBy = u);

        inspectionPhotoRepository.persist(photo);

        auditEvent.fire(new AuditEvent(
                username, AuditAction.UPLOAD, "InspectionPhoto", photo.id, operationId,
                null, null,
                "Inspection photo uploaded: " + originalName
        ));

        // Notify client
        if (operation.client != null && operation.client.email != null) {
            notificationService.send(operationId, operation.client.email,
                    "Inspection Photo Uploaded - " + operation.referenceNumber,
                    "An inspection photo has been uploaded for operation " + operation.referenceNumber
                            + ". Please log in to the Janus platform for more details.");
        }

        // Internal notification
        notificationService.send(operationId, inspectionPhotoEmail,
                "Inspection Photo Uploaded - " + operation.referenceNumber,
                "An inspection photo (" + originalName + ") has been uploaded for operation "
                        + operation.referenceNumber + " by " + username + ".");

        return photo;
    }

    public List<InspectionPhoto> getPhotos(Long operationId) {
        operationService.findById(operationId);
        return inspectionPhotoRepository.findByOperationId(operationId);
    }

    // ── Expense methods ──────────────────────────────────────────────────

    @Transactional
    public InspectionExpense addExpense(Long operationId, CreateExpenseRequest request, String username) {
        var operation = operationService.findById(operationId);

        if (!ALLOWED_STATUSES.contains(operation.status)) {
            throw new BusinessException(
                    "Expenses can only be added when operation is in SUBMITTED_TO_CUSTOMS or VALUATION_REVIEW status");
        }

        var expense = new InspectionExpense();
        expense.operation = operation;
        expense.category = request.category();
        expense.description = request.description();
        expense.amount = request.amount();
        expense.currency = request.currency() != null ? request.currency() : "USD";
        expense.expenseDate = request.expenseDate() != null ? request.expenseDate() : LocalDate.now();
        expense.justification = request.justification();

        userRepository.findByUsername(username).ifPresent(u -> expense.registeredBy = u);

        inspectionExpenseRepository.persist(expense);

        auditEvent.fire(new AuditEvent(
                username, AuditAction.CREATE, "InspectionExpense", expense.id, operationId,
                null, null,
                "Expense added: " + request.category() + " - " + request.amount()
        ));

        LOG.infof("Expense added for operation %d by %s: %s %s", operationId, username, request.amount(), expense.currency);

        return expense;
    }

    @Transactional
    public InspectionExpense updateExpense(Long operationId, Long expenseId, CreateExpenseRequest request, String username) {
        var operation = operationService.findById(operationId);

        if (!ALLOWED_STATUSES.contains(operation.status)) {
            throw new BusinessException(
                    "Expenses can only be updated when operation is in SUBMITTED_TO_CUSTOMS or VALUATION_REVIEW status");
        }

        var expense = inspectionExpenseRepository.findByIdOptional(expenseId)
                .orElseThrow(() -> new jakarta.ws.rs.NotFoundException("Expense not found"));

        if (!expense.operation.id.equals(operationId)) {
            throw new BusinessException("Expense does not belong to the specified operation");
        }

        if (!expense.active) {
            throw new BusinessException("Cannot update a deleted expense");
        }

        expense.category = request.category();
        expense.description = request.description();
        expense.amount = request.amount();
        expense.currency = request.currency() != null ? request.currency() : expense.currency;
        expense.expenseDate = request.expenseDate() != null ? request.expenseDate() : expense.expenseDate;
        expense.justification = request.justification();

        auditEvent.fire(new AuditEvent(
                username, AuditAction.UPDATE, "InspectionExpense", expense.id, operationId,
                null, null,
                "Expense updated: " + request.category() + " - " + request.amount()
        ));

        return expense;
    }

    @Transactional
    public void deleteExpense(Long operationId, Long expenseId, String username) {
        var operation = operationService.findById(operationId);

        if (!ALLOWED_STATUSES.contains(operation.status)) {
            throw new BusinessException(
                    "Expenses can only be deleted when operation is in SUBMITTED_TO_CUSTOMS or VALUATION_REVIEW status");
        }

        var expense = inspectionExpenseRepository.findByIdOptional(expenseId)
                .orElseThrow(() -> new jakarta.ws.rs.NotFoundException("Expense not found"));

        if (!expense.operation.id.equals(operationId)) {
            throw new BusinessException("Expense does not belong to the specified operation");
        }

        expense.active = false;

        auditEvent.fire(new AuditEvent(
                username, AuditAction.DELETE, "InspectionExpense", expense.id, operationId,
                null, null,
                "Expense deleted: " + expense.category + " - " + expense.amount
        ));
    }

    public List<InspectionExpense> getExpenses(Long operationId) {
        operationService.findById(operationId);
        return inspectionExpenseRepository.findByOperationId(operationId);
    }

    public BigDecimal getExpensesTotal(Long operationId) {
        operationService.findById(operationId);
        return inspectionExpenseRepository.sumAmountByOperationId(operationId);
    }
}
