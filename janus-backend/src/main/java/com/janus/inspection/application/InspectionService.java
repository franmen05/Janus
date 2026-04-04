package com.janus.inspection.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.document.domain.service.DocumentValidationService;
import com.janus.document.infrastructure.storage.StorageService;
import com.janus.inspection.api.dto.ChargeCrossReferenceResponse;
import com.janus.inspection.api.dto.CreateExpenseRequest;
import com.janus.inspection.api.dto.SendToBillingResponse;
import com.janus.inspection.domain.model.BillingStatus;
import com.janus.inspection.domain.model.ChargeType;
import com.janus.inspection.domain.model.InspectionExpense;
import com.janus.inspection.domain.model.PaymentStatus;
import com.janus.inspection.domain.model.InspectionPhoto;
import com.janus.inspection.domain.repository.ExpenseCategoryConfigRepository;
import com.janus.inspection.domain.repository.InspectionExpenseRepository;
import com.janus.inspection.domain.repository.InspectionPhotoRepository;
import com.janus.notification.application.NotificationService;
import com.janus.payment.application.LiquidationService;
import com.janus.payment.domain.model.Liquidation;
import com.janus.payment.domain.model.LiquidationStatus;
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
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@ApplicationScoped
public class InspectionService {

    private static final Logger LOG = Logger.getLogger(InspectionService.class);

    private static final Set<OperationStatus> ALLOWED_STATUSES = Set.of(
            OperationStatus.SUBMITTED_TO_CUSTOMS,
            OperationStatus.VALUATION_REVIEW,
            OperationStatus.PAYMENT_PREPARATION,
            OperationStatus.IN_TRANSIT
    );

    @Inject
    OperationService operationService;

    @Inject
    InspectionPhotoRepository inspectionPhotoRepository;

    @Inject
    InspectionExpenseRepository inspectionExpenseRepository;

    @Inject
    ExpenseCategoryConfigRepository expenseCategoryConfigRepository;

    @Inject
    UserRepository userRepository;

    @Inject
    StorageService storageService;

    @Inject
    DocumentValidationService documentValidationService;

    @Inject
    NotificationService notificationService;

    @Inject
    LiquidationService liquidationService;

    @Inject
    Event<AuditEvent> auditEvent;

    @ConfigProperty(name = "janus.notification.inspection-photo-email", defaultValue = "customs-team@janus.com")
    String inspectionPhotoEmail;

    @Transactional
    public void setInspectionType(Long operationId, InspectionType inspectionType, String comment, String username) {
        var operation = operationService.findById(operationId);

        if (!ALLOWED_STATUSES.contains(operation.status)) {
            throw new BusinessException(
                    "Inspection type can only be set when operation is in SUBMITTED_TO_CUSTOMS, VALUATION_REVIEW, PAYMENT_PREPARATION or IN_TRANSIT status");
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
                    "Photos can only be uploaded when operation is in SUBMITTED_TO_CUSTOMS, VALUATION_REVIEW, PAYMENT_PREPARATION or IN_TRANSIT status");
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
                    "Expenses can only be added when operation is in SUBMITTED_TO_CUSTOMS, VALUATION_REVIEW, PAYMENT_PREPARATION or IN_TRANSIT status");
        }

        var categoryConfig = expenseCategoryConfigRepository.findByName(request.category())
                .orElseThrow(() -> new BusinessException("INVALID_EXPENSE_CATEGORY",
                        "Expense category '" + request.category() + "' does not exist"));
        if (!categoryConfig.active) {
            throw new BusinessException("INACTIVE_EXPENSE_CATEGORY",
                    "Expense category '" + request.category() + "' is not active");
        }

        var expense = new InspectionExpense();
        expense.operation = operation;
        expense.category = request.category();
        expense.description = request.description();
        expense.amount = request.amount();
        expense.currency = request.currency() != null ? request.currency() : "USD";
        expense.expenseDate = request.expenseDate();
        expense.justification = request.justification();
        expense.responsable = request.responsable();
        expense.paymentStatus = request.paymentStatus() != null ? request.paymentStatus() : PaymentStatus.PENDING;
        expense.reimbursable = request.reimbursable() != null ? request.reimbursable() : true;

        // New charge modal fields
        expense.chargeType = request.chargeType() != null ? request.chargeType() : ChargeType.EXPENSE;
        expense.quantity = request.quantity() != null ? request.quantity() : 1;
        expense.units = request.units();
        expense.rate = request.rate();
        if (expense.rate != null && expense.quantity > 0) {
            expense.amount = BigDecimal.valueOf(expense.quantity).multiply(expense.rate);
        }
        expense.paymentType = request.paymentType();
        expense.billToType = request.billToType();
        expense.billToName = request.billToName();
        expense.invoiceNumber = request.invoiceNumber();
        expense.invoiceDate = request.invoiceDate();
        expense.referenceNumberCharge = request.referenceNumber();
        expense.showOnDocuments = request.showOnDocuments() != null ? request.showOnDocuments() : true;
        expense.updateRelated = request.updateRelated() != null ? request.updateRelated() : false;
        expense.notes = request.notes();

        userRepository.findByUsername(username).ifPresent(u -> expense.registeredBy = u);

        inspectionExpenseRepository.persist(expense);

        auditEvent.fire(new AuditEvent(
                username, AuditAction.CREATE, "InspectionExpense", expense.id, operationId,
                null, null,
                "Expense added: " + request.category() + " - " + expense.amount
        ));

        LOG.infof("Expense added for operation %d by %s: %s %s", operationId, username, expense.amount, expense.currency);

        regeneratePreliminaryLiquidation(operationId, username);

        return expense;
    }

    @Transactional
    public InspectionExpense updateExpense(Long operationId, Long expenseId, CreateExpenseRequest request, String username) {
        var operation = operationService.findById(operationId);

        if (!ALLOWED_STATUSES.contains(operation.status)) {
            throw new BusinessException(
                    "Expenses can only be updated when operation is in SUBMITTED_TO_CUSTOMS, VALUATION_REVIEW, PAYMENT_PREPARATION or IN_TRANSIT status");
        }

        var expense = inspectionExpenseRepository.findByIdOptional(expenseId)
                .orElseThrow(() -> new jakarta.ws.rs.NotFoundException("Expense not found"));

        if (!expense.operation.id.equals(operationId)) {
            throw new BusinessException("Expense does not belong to the specified operation");
        }

        if (!expense.active) {
            throw new BusinessException("Cannot update a deleted expense");
        }

        var categoryConfig = expenseCategoryConfigRepository.findByName(request.category())
                .orElseThrow(() -> new BusinessException("INVALID_EXPENSE_CATEGORY",
                        "Expense category '" + request.category() + "' does not exist"));
        if (!categoryConfig.active) {
            throw new BusinessException("INACTIVE_EXPENSE_CATEGORY",
                    "Expense category '" + request.category() + "' is not active");
        }

        expense.category = request.category();
        expense.description = request.description();
        expense.amount = request.amount();
        expense.currency = request.currency() != null ? request.currency() : expense.currency;
        expense.expenseDate = request.expenseDate();
        expense.justification = request.justification();
        expense.responsable = request.responsable();
        expense.paymentStatus = request.paymentStatus() != null ? request.paymentStatus() : expense.paymentStatus;
        expense.reimbursable = request.reimbursable() != null ? request.reimbursable() : expense.reimbursable;

        // New charge modal fields
        expense.chargeType = request.chargeType() != null ? request.chargeType() : expense.chargeType;
        expense.quantity = request.quantity() != null ? request.quantity() : expense.quantity;
        expense.units = request.units();
        expense.rate = request.rate();
        if (expense.rate != null && expense.quantity > 0) {
            expense.amount = BigDecimal.valueOf(expense.quantity).multiply(expense.rate);
        }
        expense.paymentType = request.paymentType();
        expense.billToType = request.billToType();
        expense.billToName = request.billToName();
        expense.invoiceNumber = request.invoiceNumber();
        expense.invoiceDate = request.invoiceDate();
        expense.referenceNumberCharge = request.referenceNumber();
        expense.showOnDocuments = request.showOnDocuments() != null ? request.showOnDocuments() : expense.showOnDocuments;
        expense.updateRelated = request.updateRelated() != null ? request.updateRelated() : expense.updateRelated;
        expense.notes = request.notes();

        auditEvent.fire(new AuditEvent(
                username, AuditAction.UPDATE, "InspectionExpense", expense.id, operationId,
                null, null,
                "Expense updated: " + request.category() + " - " + expense.amount
        ));

        regeneratePreliminaryLiquidation(operationId, username);

        return expense;
    }

    @Transactional
    public void deleteExpense(Long operationId, Long expenseId, String username) {
        var operation = operationService.findById(operationId);

        if (!ALLOWED_STATUSES.contains(operation.status)) {
            throw new BusinessException(
                    "Expenses can only be deleted when operation is in SUBMITTED_TO_CUSTOMS, VALUATION_REVIEW, PAYMENT_PREPARATION or IN_TRANSIT status");
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

        regeneratePreliminaryLiquidation(operationId, username);
    }

    public List<InspectionExpense> getExpenses(Long operationId, ChargeType chargeType) {
        operationService.findById(operationId);
        if (chargeType != null) {
            return inspectionExpenseRepository.findByOperationIdAndChargeType(operationId, chargeType);
        }
        return inspectionExpenseRepository.findByOperationId(operationId);
    }

    public BigDecimal getExpensesTotal(Long operationId) {
        operationService.findById(operationId);
        return inspectionExpenseRepository.sumAmountByOperationId(operationId);
    }

    public BigDecimal getIncomeTotal(Long operationId) {
        return inspectionExpenseRepository.sumAmountByOperationIdAndChargeType(operationId, ChargeType.INCOME);
    }

    public BigDecimal getExpenseTotal(Long operationId) {
        return inspectionExpenseRepository.sumAmountByOperationIdAndChargeType(operationId, ChargeType.EXPENSE);
    }

    // ── Cross-reference & Billing ─────────────────────────────────────────

    public ChargeCrossReferenceResponse getChargeCrossReference(Long operationId) {
        operationService.findById(operationId);

        var allActive = inspectionExpenseRepository.findByOperationId(operationId);

        var incomeCharges = allActive.stream()
                .filter(e -> e.chargeType == ChargeType.INCOME)
                .toList();
        var expenseCharges = allActive.stream()
                .filter(e -> e.chargeType == ChargeType.EXPENSE)
                .toList();

        var totalIncome = incomeCharges.stream()
                .map(e -> e.amount != null ? e.amount : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        var totalExpenses = expenseCharges.stream()
                .map(e -> e.amount != null ? e.amount : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        var balance = totalIncome.subtract(totalExpenses);

        var incomeByCategory = buildCategoryBreakdown(incomeCharges);
        var expenseByCategory = buildCategoryBreakdown(expenseCharges);

        long totalReimbursableCount = allActive.stream()
                .filter(e -> e.reimbursable)
                .count();
        long reimbursableSentToBillingCount = allActive.stream()
                .filter(e -> e.reimbursable)
                .filter(e -> e.billingStatus != BillingStatus.NONE)
                .count();
        boolean allReimbursableSentToBilling = totalReimbursableCount > 0 && reimbursableSentToBillingCount == totalReimbursableCount;

        return new ChargeCrossReferenceResponse(
                totalIncome, totalExpenses, balance,
                incomeByCategory, expenseByCategory,
                reimbursableSentToBillingCount, totalReimbursableCount, allReimbursableSentToBilling
        );
    }

    @Transactional
    public SendToBillingResponse sendReimbursableToBilling(Long operationId, String username) {
        operationService.findById(operationId);

        var pendingReimbursableCharges = inspectionExpenseRepository
                .findActiveReimbursableWithBillingStatus(operationId, BillingStatus.NONE);

        for (var charge : pendingReimbursableCharges) {
            charge.billingStatus = BillingStatus.SENT_TO_BILLING;
        }

        if (!pendingReimbursableCharges.isEmpty()) {
            auditEvent.fire(new AuditEvent(
                    username, AuditAction.UPDATE, "InspectionExpense", null, operationId,
                    null, null,
                    "Sent " + pendingReimbursableCharges.size() + " reimbursable charges to billing"
            ));
        }

        LOG.infof("Sent %d reimbursable charges to billing for operation %d by %s",
                pendingReimbursableCharges.size(), operationId, username);

        return new SendToBillingResponse(pendingReimbursableCharges.size());
    }

    private void regeneratePreliminaryLiquidation(Long operationId, String username) {
        var existing = (Liquidation) Liquidation.find("operation.id = ?1", operationId).firstResult();
        if (existing != null ) {
            liquidationService.generateLiquidation(operationId, existing.totalAgencyServices, username);
        }
    }

    private List<ChargeCrossReferenceResponse.CategoryBreakdown> buildCategoryBreakdown(List<InspectionExpense> charges) {
        Map<String, BigDecimal> amountByCategory = charges.stream()
                .collect(Collectors.groupingBy(
                        e -> e.category != null ? e.category : "Uncategorized",
                        Collectors.reducing(BigDecimal.ZERO,
                                e -> e.amount != null ? e.amount : BigDecimal.ZERO,
                                BigDecimal::add)
                ));
        Map<String, Boolean> reimbursableByCategory = charges.stream()
                .collect(Collectors.groupingBy(
                        e -> e.category != null ? e.category : "Uncategorized",
                        Collectors.reducing(false, e -> e.reimbursable, (a, b) -> a || b)
                ));
        Map<String, List<String>> descriptionsByCategory = charges.stream()
                .collect(Collectors.groupingBy(
                        e -> e.category != null ? e.category : "Uncategorized",
                        Collectors.mapping(
                                e -> e.description != null ? e.description : "",
                                Collectors.filtering(d -> !d.isEmpty(), Collectors.toList())
                        )
                ));
        return amountByCategory.entrySet().stream()
                .map(entry -> new ChargeCrossReferenceResponse.CategoryBreakdown(
                        entry.getKey(), entry.getValue(),
                        reimbursableByCategory.getOrDefault(entry.getKey(), false),
                        descriptionsByCategory.getOrDefault(entry.getKey(), List.of())))
                .toList();
    }
}
