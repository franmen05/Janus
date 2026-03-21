package com.janus.valuation.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.declaration.domain.repository.DeclarationRepository;
import com.janus.document.domain.model.DocumentStatus;
import com.janus.document.domain.model.DocumentType;
import com.janus.document.domain.repository.DocumentRepository;
import com.janus.operation.api.dto.ChangeStatusRequest;
import com.janus.operation.application.OperationService;
import com.janus.operation.domain.model.BlAvailability;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.model.TransportMode;
import com.janus.shared.infrastructure.audit.AuditDiffUtil;
import com.janus.shared.infrastructure.exception.BusinessException;
import com.janus.shared.infrastructure.util.JsonUtil;
import com.janus.valuation.api.dto.ExternalPermitRequest;
import com.janus.valuation.api.dto.ValuationChecklistResponse;
import com.janus.valuation.domain.model.ExternalPermit;
import com.janus.valuation.domain.model.ExternalPermitStatus;
import com.janus.valuation.domain.repository.ExternalPermitRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import org.jboss.logging.Logger;

@ApplicationScoped
public class ValuationService {

    private static final Logger LOG = Logger.getLogger(ValuationService.class);

    private static final Set<OperationStatus> VALUATION_STATUSES = Set.of(
            OperationStatus.VALUATION_REVIEW,
            OperationStatus.PENDING_EXTERNAL_APPROVAL
    );

    @Inject
    OperationService operationService;

    @Inject
    ExternalPermitRepository permitRepository;

    @Inject
    DeclarationRepository declarationRepository;

    @Inject
    DocumentRepository documentRepository;

    @Inject
    Event<AuditEvent> auditEvent;

    // ── Permits ──

    public java.util.List<ExternalPermit> getPermits(Long operationId) {
        operationService.findById(operationId);
        return permitRepository.findByOperationId(operationId);
    }

    @Transactional
    public ExternalPermit createPermit(Long operationId, ExternalPermitRequest request, String username) {
        var operation = operationService.findById(operationId);
        validateValuationStatus(operation);

        var permit = new ExternalPermit();
        permit.operation = operation;
        permit.permitType = request.permitType();
        permit.status = request.status() != null ? request.status() : ExternalPermitStatus.PENDIENTE;
        permit.referenceNumber = request.referenceNumber();
        permit.issuedDate = request.issuedDate();
        permit.expiryDate = request.expiryDate();
        permit.notes = request.notes();
        permit.updatedBy = username;

        permitRepository.persist(permit);

        auditEvent.fire(new AuditEvent(
                username, AuditAction.CREATE, "ExternalPermit", permit.id, operationId,
                null, AuditDiffUtil.buildCreateData(Map.of(
                        "permitType", permit.permitType,
                        "status", permit.status.name(),
                        "referenceNumber", permit.referenceNumber != null ? permit.referenceNumber : ""
                )),
                "External permit created: " + request.permitType() + " - " + permit.status
        ));

        handlePermitAutoTransition(operation, username);

        return permit;
    }

    @Transactional
    public ExternalPermit updatePermit(Long operationId, Long permitId, ExternalPermitRequest request, String username) {
        var operation = operationService.findById(operationId);
        validateValuationStatus(operation);

        var permit = permitRepository.findByIdOptional(permitId)
                .orElseThrow(() -> new jakarta.ws.rs.NotFoundException("Permit not found"));

        if (!permit.operation.id.equals(operationId)) {
            throw new BusinessException("Permit does not belong to the specified operation");
        }

        var beforeMap = new LinkedHashMap<String, Object>();
        beforeMap.put("permitType", permit.permitType);
        beforeMap.put("status", permit.status.name());
        beforeMap.put("referenceNumber", permit.referenceNumber != null ? permit.referenceNumber : "");
        beforeMap.put("notes", permit.notes != null ? permit.notes : "");

        var previousStatus = permit.status;
        permit.permitType = request.permitType();
        permit.status = request.status() != null ? request.status() : permit.status;
        permit.referenceNumber = request.referenceNumber();
        permit.issuedDate = request.issuedDate();
        permit.expiryDate = request.expiryDate();
        permit.notes = request.notes();
        permit.updatedBy = username;

        var afterMap = new LinkedHashMap<String, Object>();
        afterMap.put("permitType", permit.permitType);
        afterMap.put("status", permit.status.name());
        afterMap.put("referenceNumber", permit.referenceNumber != null ? permit.referenceNumber : "");
        afterMap.put("notes", permit.notes != null ? permit.notes : "");
        var diff = AuditDiffUtil.buildDiff(beforeMap, afterMap);

        auditEvent.fire(new AuditEvent(
                username, AuditAction.UPDATE, "ExternalPermit", permit.id, operationId,
                diff[0], diff[1],
                "External permit updated: " + request.permitType() + " status " + previousStatus + " → " + permit.status
        ));

        handlePermitAutoTransition(operation, username);

        return permit;
    }

    @Transactional
    public void deletePermit(Long operationId, Long permitId, String username) {
        var operation = operationService.findById(operationId);
        validateValuationStatus(operation);

        var permit = permitRepository.findByIdOptional(permitId)
                .orElseThrow(() -> new jakarta.ws.rs.NotFoundException("Permit not found"));

        if (!permit.operation.id.equals(operationId)) {
            throw new BusinessException("Permit does not belong to the specified operation");
        }

        permitRepository.delete(permit);

        auditEvent.fire(new AuditEvent(
                username, AuditAction.DELETE, "ExternalPermit", permitId, operationId,
                AuditDiffUtil.buildCreateData(Map.of(
                        "permitType", permit.permitType,
                        "status", permit.status.name()
                )), null,
                "External permit deleted: " + permit.permitType
        ));

        // Re-check auto-transition after deletion
        handlePermitAutoTransition(operation, username);
    }

    // ── Checklist ──

    public ValuationChecklistResponse getChecklist(Long operationId) {
        var operation = operationService.findById(operationId);
        var documents = documentRepository.findByOperationId(operationId);
        var declarations = declarationRepository.findByOperationId(operationId);
        var declaration = declarations.isEmpty() ? null : declarations.get(0);

        var items = new ArrayList<ValuationChecklistResponse.ChecklistItem>();

        // 1. BL validated
        boolean blValidated = documents.stream()
                .filter(d -> d.active)
                .filter(d -> d.documentType == DocumentType.BL)
                .anyMatch(d -> d.status == DocumentStatus.VALIDATED);
        items.add(new ValuationChecklistResponse.ChecklistItem(
                "BL_VALIDATED", "Bill of Lading validated", blValidated,
                blValidated ? "BL is validated" : "BL must be validated"));

        // 1b. BL availability confirmed (only for maritime operations)
        if (operation.transportMode == TransportMode.MARITIME) {
            boolean blAvailabilityConfirmed = operation.blAvailability != null
                    && operation.blAvailability != BlAvailability.NOT_AVAILABLE;
            items.add(new ValuationChecklistResponse.ChecklistItem(
                    "BL_AVAILABILITY_CONFIRMED", "BL availability confirmed", blAvailabilityConfirmed,
                    blAvailabilityConfirmed ? "BL: " + operation.blAvailability : "BL availability not confirmed"));
        }

        // 2. Commercial invoice present
        boolean invoicePresent = documents.stream()
                .filter(d -> d.active)
                .anyMatch(d -> d.documentType == DocumentType.COMMERCIAL_INVOICE);
        items.add(new ValuationChecklistResponse.ChecklistItem(
                "INVOICE_PRESENT", "Commercial invoice uploaded", invoicePresent,
                invoicePresent ? "Invoice present" : "Commercial invoice is missing"));

        // 3. FOB value set
        boolean fobSet = declaration != null && declaration.fobValue != null && declaration.fobValue.compareTo(BigDecimal.ZERO) > 0;
        items.add(new ValuationChecklistResponse.ChecklistItem(
                "FOB_VALUE_SET", "FOB value declared", fobSet,
                fobSet ? "FOB value: " + declaration.fobValue : "FOB value not set in declaration"));

        // 4. Incoterm set
        boolean incotermSet = operation.incoterm != null && !operation.incoterm.isBlank();
        items.add(new ValuationChecklistResponse.ChecklistItem(
                "INCOTERM_SET", "Incoterm defined", incotermSet,
                incotermSet ? "Incoterm: " + operation.incoterm : "Incoterm not set"));

        // 5. Packing list present
        boolean packingListPresent = documents.stream()
                .filter(d -> d.active)
                .anyMatch(d -> d.documentType == DocumentType.PACKING_LIST);
        items.add(new ValuationChecklistResponse.ChecklistItem(
                "PACKING_LIST_PRESENT", "Packing list uploaded", packingListPresent,
                packingListPresent ? "Packing list present" : "Packing list is missing"));

        // 6. External permits cleared
        boolean hasBlockingPermits = permitRepository.hasBlockingPermits(operationId);
        boolean hasPermits = permitRepository.hasAnyPermits(operationId);
        boolean permitsPassed = !hasBlockingPermits;
        items.add(new ValuationChecklistResponse.ChecklistItem(
                "PERMITS_CLEARED", "External permits cleared", permitsPassed,
                hasBlockingPermits ? "Some permits are still EN_TRAMITE" : (hasPermits ? "All permits cleared" : "No external permits registered")));

        // 7. Local charges validated
        boolean localChargesValidated = Boolean.TRUE.equals(operation.localChargesValidated);
        boolean hasLocalChargesDoc = documents.stream()
                .filter(d -> d.active)
                .anyMatch(d -> d.documentType == DocumentType.LOCAL_CHARGES_RECEIPT);
        if (hasLocalChargesDoc) {
            items.add(new ValuationChecklistResponse.ChecklistItem(
                    "LOCAL_CHARGES_VALIDATED", "Local charges validated", localChargesValidated,
                    localChargesValidated ? "Local charges validated" : "Local charges receipt uploaded but not validated"));
        }

        boolean allPassed = items.stream().allMatch(ValuationChecklistResponse.ChecklistItem::passed);

        return new ValuationChecklistResponse(items, allPassed);
    }

    // ── Finalize Valuation ──

    @Transactional
    public void finalizeValuation(Long operationId, String username) {
        var operation = operationService.findById(operationId);

        if (operation.status != OperationStatus.VALUATION_REVIEW) {
            throw new BusinessException("Operation must be in VALUATION_REVIEW status to finalize valuation");
        }

        operation.valuationFinalizedAt = LocalDateTime.now();

        auditEvent.fire(new AuditEvent(
                username, AuditAction.APPROVAL, "Operation", operation.id, operationId,
                null, AuditDiffUtil.buildCreateData(Map.of(
                        "valuationFinalizedAt", operation.valuationFinalizedAt.toString()
                )),
                "Valuation finalized"
        ));

        // Trigger status change (compliance rules will run)
        operationService.changeStatus(operationId,
                new ChangeStatusRequest(OperationStatus.PAYMENT_PREPARATION,
                        "Valuation finalized"),
                username, null);
    }

    // ── Local charges ──

    @Transactional
    public Operation toggleLocalChargesValidated(Long operationId, boolean value, String username) {
        var operation = operationService.findById(operationId);
        validateValuationStatus(operation);

        operation.localChargesValidated = value;

        auditEvent.fire(new AuditEvent(
                username, AuditAction.UPDATE, "Operation", operation.id, operationId,
                JsonUtil.toJson(Map.of("localChargesValidated", String.valueOf(!value))),
                JsonUtil.toJson(Map.of("localChargesValidated", String.valueOf(value))),
                "Local charges validated toggled to " + value
        ));

        // Force lazy init for DTO mapping
        if (operation.client != null) { var ignored = operation.client.name; }
        if (operation.assignedAgent != null) { var ignored = operation.assignedAgent.fullName; }
        if (operation.arrivalPort != null) { var ignored = operation.arrivalPort.code; }

        return operation;
    }

    // ── Private helpers ──

    private void validateValuationStatus(Operation operation) {
        if (!VALUATION_STATUSES.contains(operation.status)) {
            throw new BusinessException(
                    "Operation must be in VALUATION_REVIEW or PENDING_EXTERNAL_APPROVAL status");
        }
    }

    private void handlePermitAutoTransition(Operation operation, String username) {
        // Flush to ensure permit changes are visible
        permitRepository.flush();

        boolean hasBlocking = permitRepository.hasBlockingPermits(operation.id);

        if (hasBlocking && operation.status == OperationStatus.VALUATION_REVIEW) {
            // Auto-transition to PENDING_EXTERNAL_APPROVAL
            operationService.changeStatus(operation.id,
                    new ChangeStatusRequest(OperationStatus.PENDING_EXTERNAL_APPROVAL,
                            "Auto-transition: external permit(s) pending approval"),
                    username, null);
        } else if (!hasBlocking && operation.status == OperationStatus.PENDING_EXTERNAL_APPROVAL) {
            // Auto-transition back to VALUATION_REVIEW
            operationService.changeStatus(operation.id,
                    new ChangeStatusRequest(OperationStatus.VALUATION_REVIEW,
                            "Auto-transition: all external permits cleared"),
                    username, null);
        }
    }
}
