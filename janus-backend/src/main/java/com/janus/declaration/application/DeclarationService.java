package com.janus.declaration.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.declaration.domain.model.CrossingDiscrepancy;
import com.janus.declaration.domain.model.CrossingResult;
import com.janus.declaration.domain.model.CrossingStatus;
import com.janus.declaration.domain.model.Declaration;
import java.math.BigDecimal;
import com.janus.declaration.domain.model.DeclarationType;
import com.janus.declaration.domain.model.TariffLine;
import com.janus.declaration.domain.repository.CrossingDiscrepancyRepository;
import com.janus.declaration.domain.repository.CrossingResultRepository;
import com.janus.declaration.domain.repository.DeclarationRepository;
import com.janus.declaration.domain.repository.TariffLineRepository;
import com.janus.declaration.domain.service.CrossingEngine;
import com.janus.declaration.domain.service.PreliquidationService;
import com.janus.notification.application.NotificationService;
import com.janus.operation.api.dto.ChangeStatusRequest;
import com.janus.operation.application.OperationService;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.shared.infrastructure.exception.BusinessException;
import com.janus.shared.infrastructure.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@ApplicationScoped
public class DeclarationService {

    private static final Set<OperationStatus> PRELIMINARY_EDITABLE_STATUSES = Set.of(
            OperationStatus.DRAFT, OperationStatus.DOCUMENTATION_COMPLETE,
            OperationStatus.IN_REVIEW, OperationStatus.PENDING_CORRECTION
    );

    private static final Set<OperationStatus> FINAL_EDITABLE_STATUSES = Set.of(
            OperationStatus.DECLARATION_IN_PROGRESS, OperationStatus.SUBMITTED_TO_CUSTOMS
    );

    @Inject
    DeclarationRepository declarationRepository;

    @Inject
    TariffLineRepository tariffLineRepository;

    @Inject
    CrossingResultRepository crossingResultRepository;

    @Inject
    CrossingDiscrepancyRepository crossingDiscrepancyRepository;

    @Inject
    CrossingEngine crossingEngine;

    @Inject
    PreliquidationService preliquidationService;

    @Inject
    OperationService operationService;

    @Inject
    NotificationService notificationService;

    @Inject
    Event<AuditEvent> auditEvent;

    @org.eclipse.microprofile.config.inject.ConfigProperty(name = "janus.app.frontend-url", defaultValue = "http://localhost:4200")
    String frontendUrl;

    @Transactional
    public Declaration registerPreliminary(Long operationId, Declaration declaration, String username) {
        return registerDeclaration(operationId, declaration, DeclarationType.PRELIMINARY, username);
    }

    @Transactional
    public Declaration registerFinal(Long operationId, Declaration declaration, String username) {
        return registerDeclaration(operationId, declaration, DeclarationType.FINAL, username);
    }

    private Declaration registerDeclaration(Long operationId, Declaration declaration,
                                             DeclarationType type, String username) {
        var operation = operationService.findById(operationId);

        if (declarationRepository.findByOperationAndType(operationId, type).isPresent()) {
            throw new BusinessException("DECLARATION_ALREADY_EXISTS", type + " declaration already exists for this operation");
        }

        declaration.operation = operation;
        declaration.declarationType = type;
        declaration.taxableBase = declaration.cifValue;
        declaration.submittedAt = LocalDateTime.now();
        declarationRepository.persist(declaration);

        auditEvent.fire(new AuditEvent(
                username, AuditAction.CREATE, "Declaration", declaration.id, operationId,
                null, null, type + " declaration registered: " + declaration.declarationNumber
        ));

        return declaration;
    }

    public List<Declaration> findByOperationId(Long operationId) {
        operationService.findById(operationId);
        return declarationRepository.findByOperationId(operationId);
    }

    @Transactional
    public Declaration updateDeclaration(Long operationId, Long declarationId, Declaration updated, String username) {
        var declaration = findById(operationId, declarationId);
        enforceEditable(declaration);

        declaration.declarationNumber = updated.declarationNumber;
        declaration.fobValue = updated.fobValue;
        declaration.insuranceValue = updated.fobValue != null
                ? updated.fobValue.multiply(new BigDecimal("0.02")).setScale(2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        declaration.freightValue = updated.freightValue;
        declaration.cifValue = updated.cifValue;
        declaration.taxableBase = updated.cifValue; // taxableBase always equals cifValue
        declaration.totalTaxes = updated.totalTaxes;
        declaration.gattMethod = updated.gattMethod;
        declaration.notes = updated.notes;

        invalidateCrossingIfFinal(declaration, operationId);

        auditEvent.fire(new AuditEvent(
                username, AuditAction.UPDATE, "Declaration", declarationId, operationId,
                null, null, "Declaration updated: " + declaration.declarationNumber
        ));

        return declaration;
    }

    public Declaration findById(Long operationId, Long declarationId) {
        operationService.findById(operationId);
        var decl = declarationRepository.findByIdOptional(declarationId)
                .orElseThrow(() -> new NotFoundException("Declaration", declarationId));
        if (!decl.operation.id.equals(operationId)) {
            throw new NotFoundException("Declaration", declarationId);
        }
        return decl;
    }

    @Transactional
    public TariffLine addTariffLine(Long operationId, Long declarationId, TariffLine line, String username) {
        var declaration = findById(operationId, declarationId);
        enforceEditable(declaration);
        line.declaration = declaration;
        tariffLineRepository.persist(line);

        invalidateCrossingIfFinal(declaration, operationId);

        auditEvent.fire(new AuditEvent(
                username, AuditAction.CREATE, "TariffLine", line.id, operationId,
                null, null, "Tariff line " + line.lineNumber + " added to declaration " + declarationId
        ));

        return line;
    }

    public List<TariffLine> getTariffLines(Long operationId, Long declarationId) {
        findById(operationId, declarationId);
        return tariffLineRepository.findByDeclarationId(declarationId);
    }

    @Transactional
    public CrossingResult executeCrossing(Long operationId, String username) {
        var operation = operationService.findById(operationId);

        var preliminary = declarationRepository.findByOperationAndType(operationId, DeclarationType.PRELIMINARY)
                .orElseThrow(() -> new BusinessException("Preliminary declaration not found"));
        var finalDecl = declarationRepository.findByOperationAndType(operationId, DeclarationType.FINAL)
                .orElseThrow(() -> new BusinessException("Final declaration not found"));

        var prelimLines = tariffLineRepository.findByDeclarationId(preliminary.id);
        var finalLines = tariffLineRepository.findByDeclarationId(finalDecl.id);

        // Remove previous crossing results before creating a new one
        crossingDiscrepancyRepository.deleteByOperationId(operationId);
        crossingResultRepository.deleteByOperationId(operationId);

        var crossingResult = new CrossingResult();
        crossingResult.operation = operation;
        crossingResult.preliminaryDeclaration = preliminary;
        crossingResult.finalDeclaration = finalDecl;
        crossingResultRepository.persist(crossingResult);

        var discrepancies = crossingEngine.compare(crossingResult, preliminary, prelimLines, finalDecl, finalLines);

        for (var d : discrepancies) {
            crossingDiscrepancyRepository.persist(d);
        }

        if (discrepancies.isEmpty()) {
            crossingResult.status = CrossingStatus.MATCH;
        } else {
            crossingResult.status = CrossingStatus.DISCREPANCY;
            notificationService.send(
                    operationId, operation.client.email,
                    "Crossing Discrepancy Detected - " + operation.referenceNumber,
                    "Discrepancies were found between preliminary and final declarations for operation "
                            + operation.referenceNumber + ". Please review."
            );
        }

        auditEvent.fire(new AuditEvent(
                username, AuditAction.CREATE, "CrossingResult", crossingResult.id, operationId,
                null, null, "Crossing executed: " + crossingResult.status
                        + " (" + discrepancies.size() + " discrepancies)"
        ));

        return crossingResult;
    }

    @Transactional
    public CrossingResult resolveCrossing(Long operationId, String comment, String username) {
        var crossingResult = crossingResultRepository.findByOperationId(operationId)
                .orElseThrow(() -> new NotFoundException("CrossingResult for operation", operationId));

        if (crossingResult.status != CrossingStatus.DISCREPANCY) {
            throw new BusinessException("CROSSING_NOT_DISCREPANCY", "Crossing is not in DISCREPANCY status");
        }

        crossingResult.status = CrossingStatus.RESOLVED;
        crossingResult.resolvedBy = username;
        crossingResult.resolutionComment = comment;
        crossingResult.resolvedAt = LocalDateTime.now();

        auditEvent.fire(new AuditEvent(
                username, AuditAction.UPDATE, "CrossingResult", crossingResult.id, operationId,
                null, null, "Crossing resolved by " + username
        ));

        return crossingResult;
    }

    public CrossingResult getCrossingResult(Long operationId) {
        operationService.findById(operationId);
        return crossingResultRepository.findByOperationId(operationId).orElse(null);
    }

    public List<CrossingDiscrepancy> getDiscrepancies(Long crossingResultId) {
        return crossingDiscrepancyRepository.findByCrossingResultId(crossingResultId);
    }

    private void enforceEditable(Declaration declaration) {
        var status = declaration.operation.status;
        if (declaration.declarationType == DeclarationType.PRELIMINARY) {
            if (!PRELIMINARY_EDITABLE_STATUSES.contains(status)) {
                throw new BusinessException("PRELIMINARY_NOT_EDITABLE",
                        "Preliminary declarations can only be edited in statuses: DRAFT, DOCUMENTATION_COMPLETE, IN_REVIEW, PENDING_CORRECTION");
            }
        } else if (declaration.declarationType == DeclarationType.FINAL) {
            if (!FINAL_EDITABLE_STATUSES.contains(status)) {
                throw new BusinessException("FINAL_NOT_EDITABLE",
                        "Final declarations can only be edited in statuses: DECLARATION_IN_PROGRESS, SUBMITTED_TO_CUSTOMS");
            }
        }
    }

    private void invalidateCrossingIfFinal(Declaration declaration, Long operationId) {
        if (declaration.declarationType == DeclarationType.FINAL) {
            crossingDiscrepancyRepository.deleteByOperationId(operationId);
            crossingResultRepository.deleteByOperationId(operationId);
        }
    }

    @Transactional
    public Declaration generatePreliquidation(Long operationId, Long declarationId, String username) {
        var declaration = findById(operationId, declarationId);
        var tariffLines = tariffLineRepository.findByDeclarationId(declarationId);

        var result = preliquidationService.calculate(declaration, tariffLines);
        declaration.cifValue = result.cifValue();
        declaration.taxableBase = result.taxableBase();
        declaration.totalTaxes = result.totalTaxes();

        invalidateCrossingIfFinal(declaration, operationId);

        auditEvent.fire(new AuditEvent(
                username, AuditAction.UPDATE, "Declaration", declarationId, operationId,
                null, null, "Preliquidation generated for declaration " + declaration.declarationNumber
        ));

        return declaration;
    }

    @Transactional
    public Declaration registerDua(Long operationId, Long declarationId, String duaNumber, String username) {
        var declaration = findById(operationId, declarationId);
        declaration.declarationNumber = duaNumber;

        auditEvent.fire(new AuditEvent(
                username, AuditAction.UPDATE, "Declaration", declarationId, operationId,
                null, null, "DUA number registered: " + duaNumber
        ));

        return declaration;
    }

    @Transactional
    public Declaration submitToDga(Long operationId, Long declarationId, String username) {
        var declaration = findById(operationId, declarationId);

        if (declaration.submittedAt != null) {
            throw new BusinessException("ALREADY_SUBMITTED_TO_DGA", "Declaration has already been submitted to DGA");
        }

        declaration.submittedAt = LocalDateTime.now();

        auditEvent.fire(new AuditEvent(
                username, AuditAction.UPDATE, "Declaration", declarationId, operationId,
                null, null, "Declaration submitted to DGA"
        ));

        // Flush so compliance rules can read the updated submittedAt
        declarationRepository.flush();

        // Auto-transition: if operation is in DECLARATION_IN_PROGRESS, advance to SUBMITTED_TO_CUSTOMS
        var operation = declaration.operation;
        if (operation.status == OperationStatus.DECLARATION_IN_PROGRESS) {
            operationService.changeStatus(operationId,
                    new ChangeStatusRequest(OperationStatus.SUBMITTED_TO_CUSTOMS,
                            "Auto-advanced after submission to DGA"),
                    username, null);
        }

        // Notify client
        if (operation.client != null && operation.client.email != null) {
            notificationService.send(operationId, operation.client.email,
                    "Declaration Submitted to DGA - " + operation.referenceNumber,
                    "The declaration for operation " + operation.referenceNumber
                            + " has been submitted to DGA. Please log in to the Janus platform for more details.");
        }

        return declaration;
    }

    @Transactional
    public Declaration approveTechnical(Long operationId, Long declarationId, String comment, String username) {
        var declaration = findById(operationId, declarationId);

        if (declaration.technicalApprovedBy != null) {
            throw new BusinessException("ALREADY_TECHNICAL_APPROVED", "Declaration already has technical approval");
        }

        declaration.technicalApprovedBy = username;
        declaration.technicalApprovedAt = LocalDateTime.now();
        declaration.technicalApprovalComment = comment;
        // Clear any previous rejection
        declaration.rejectedBy = null;
        declaration.rejectedAt = null;
        declaration.rejectionComment = null;

        auditEvent.fire(new AuditEvent(
                username, AuditAction.APPROVAL, "Declaration", declarationId, operationId,
                null, null, "Technical approval by " + username
        ));

        return declaration;
    }

    @Transactional
    public Declaration approveFinal(Long operationId, Long declarationId, String comment, String username) {
        var declaration = findById(operationId, declarationId);

        if (declaration.technicalApprovedBy == null) {
            throw new BusinessException("TECHNICAL_APPROVAL_REQUIRED", "Technical approval is required before final approval");
        }
        if (declaration.finalApprovedBy != null) {
            throw new BusinessException("ALREADY_FINAL_APPROVED", "Declaration already has final approval");
        }

        declaration.finalApprovedBy = username;
        declaration.finalApprovedAt = LocalDateTime.now();
        declaration.finalApprovalComment = comment;

        auditEvent.fire(new AuditEvent(
                username, AuditAction.APPROVAL, "Declaration", declarationId, operationId,
                null, null, "Final approval by " + username
        ));

        // Flush approval changes so compliance rules can read them
        declarationRepository.flush();

        // Auto-advance operation from DECLARATION_IN_PROGRESS to SUBMITTED_TO_CUSTOMS
        var operation = declaration.operation;
        if (operation.status == OperationStatus.DECLARATION_IN_PROGRESS) {
            operationService.changeStatus(operationId,
                    new ChangeStatusRequest(OperationStatus.SUBMITTED_TO_CUSTOMS, "Auto-advanced after final approval"),
                    username, null);
        }

        return declaration;
    }

    @Transactional
    public void sendApprovalLink(Long operationId, Long declarationId, String username) {
        var declaration = findById(operationId, declarationId);
        var operation = declaration.operation;

        var approvalUrl = frontendUrl + "/operations/" + operationId + "?action=approve-final";

        if (operation.client != null && operation.client.email != null) {
            notificationService.send(operationId, operation.client.email,
                    "Approval Required - " + operation.referenceNumber,
                    "Please review and approve the final declaration for operation "
                            + operation.referenceNumber + ". Click here to approve: " + approvalUrl);
        }

        auditEvent.fire(new AuditEvent(
                username, AuditAction.UPDATE, "Declaration", declarationId, operationId,
                null, null, "Approval link sent for declaration " + declaration.declarationNumber
        ));
    }

    @Transactional
    public Declaration reject(Long operationId, Long declarationId, String comment, String username) {
        var declaration = findById(operationId, declarationId);

        declaration.rejectedBy = username;
        declaration.rejectedAt = LocalDateTime.now();
        declaration.rejectionComment = comment;
        // Clear approvals on rejection
        declaration.technicalApprovedBy = null;
        declaration.technicalApprovedAt = null;
        declaration.technicalApprovalComment = null;
        declaration.finalApprovedBy = null;
        declaration.finalApprovedAt = null;
        declaration.finalApprovalComment = null;

        auditEvent.fire(new AuditEvent(
                username, AuditAction.REJECTION, "Declaration", declarationId, operationId,
                null, null, "Declaration rejected by " + username
        ));

        // Auto-return operation to PENDING_CORRECTION on rejection
        var operation = declaration.operation;
        if (operation.status == OperationStatus.PRELIQUIDATION_REVIEW) {
            operationService.changeStatus(operationId,
                    new ChangeStatusRequest(OperationStatus.PENDING_CORRECTION, "Auto-returned after rejection"),
                    username, null);
        }

        return declaration;
    }
}
