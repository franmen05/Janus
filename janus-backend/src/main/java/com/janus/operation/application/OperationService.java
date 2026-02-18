package com.janus.operation.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.client.domain.repository.ClientRepository;
import com.janus.notification.application.NotificationService;
import com.janus.operation.api.dto.ChangeStatusRequest;
import com.janus.operation.api.dto.CreateOperationRequest;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.model.StatusHistory;
import com.janus.operation.domain.repository.OperationRepository;
import com.janus.operation.domain.repository.StatusHistoryRepository;
import com.janus.operation.domain.service.StatusTransitionService;
import com.janus.compliance.domain.service.ComplianceValidationService;
import com.janus.shared.infrastructure.exception.BusinessException;
import com.janus.shared.infrastructure.exception.NotFoundException;
import com.janus.shared.infrastructure.util.JsonUtil;
import com.janus.user.domain.model.User;
import com.janus.user.domain.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class OperationService {

    @Inject
    OperationRepository operationRepository;

    @Inject
    StatusHistoryRepository statusHistoryRepository;

    @Inject
    ClientRepository clientRepository;

    @Inject
    UserRepository userRepository;

    @Inject
    StatusTransitionService statusTransitionService;

    @Inject
    NotificationService notificationService;

    @Inject
    ComplianceValidationService complianceValidationService;

    @Inject
    Event<AuditEvent> auditEvent;

    public List<Operation> listAll() {
        return operationRepository.listAll();
    }

    public List<Operation> findByStatus(OperationStatus status) {
        return operationRepository.findByStatus(status);
    }

    public List<Operation> findByClientId(Long clientId) {
        return operationRepository.findByClientId(clientId);
    }

    public Operation findById(Long id) {
        return operationRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Operation", id));
    }

    @Transactional
    public Operation create(CreateOperationRequest request, String username) {

        var client = clientRepository.findByIdOptional(request.clientId())
                .orElseThrow(() -> new NotFoundException("Client", request.clientId()));

        var op = new Operation();
        op.referenceNumber = generateReferenceNumber();
        op.client = client;
        op.cargoType = request.cargoType();
        op.inspectionType = request.inspectionType();
        op.status = OperationStatus.DRAFT;
        op.originCountry = request.originCountry();
        op.notes = request.notes();
        op.deadline = request.deadline();

        if (request.assignedAgentId() != null) {
            op.assignedAgent = userRepository.findByIdOptional(request.assignedAgentId())
                    .orElseThrow(() -> new NotFoundException("User", request.assignedAgentId()));
        }

        operationRepository.persist(op);

        recordStatusChange(op, null, OperationStatus.DRAFT, username, "Operation created", null);

        auditEvent.fire(new AuditEvent(
                username, AuditAction.CREATE,
                "Operation",
                op.id,
                op.id,
                null, JsonUtil.toJson(Map.of(
                        "referenceNumber", op.referenceNumber,
                        "status", op.status.name(),
                        "cargoType", op.cargoType.name(),
                        "inspectionType", op.inspectionType.name()
                )),
                "Operation created: " + op.referenceNumber
        ));

        return op;
    }

    @Transactional
    public Operation update(Long id, CreateOperationRequest request, String username) {
        var op = findById(id);

        if (statusTransitionService.isFinalStatus(op.status)) {
            throw new BusinessException("Cannot update a closed or cancelled operation");
        }

        var previousData = JsonUtil.toJson(Map.of(
                "cargoType", op.cargoType.name(),
                "inspectionType", op.inspectionType.name(),
                "notes", op.notes != null ? op.notes : ""
        ));

        op.client = clientRepository.findByIdOptional(request.clientId())
                .orElseThrow(() -> new NotFoundException("Client", request.clientId()));
        op.cargoType = request.cargoType();
        op.inspectionType = request.inspectionType();
        op.originCountry = request.originCountry();
        op.notes = request.notes();
        op.deadline = request.deadline();

        if (request.assignedAgentId() != null) {
            op.assignedAgent = userRepository.findByIdOptional(request.assignedAgentId())
                    .orElseThrow(() -> new NotFoundException("User", request.assignedAgentId()));
        }

        var newData = JsonUtil.toJson(Map.of(
                "cargoType", op.cargoType.name(),
                "inspectionType", op.inspectionType.name(),
                "notes", op.notes != null ? op.notes : ""
        ));

        auditEvent.fire(new AuditEvent(
                username, AuditAction.UPDATE, "Operation", op.id, op.id,
                previousData, newData, "Operation updated"
        ));

        return op;
    }

    @Transactional
    public void changeStatus(Long id, ChangeStatusRequest request, String username, String ipAddress) {
        var op = findById(id);
        var previousStatus = op.status;

        statusTransitionService.validateTransition(previousStatus, request.newStatus());

        // Run compliance rules (skip for CANCELLED transitions)
        if (request.newStatus() != OperationStatus.CANCELLED) {
            var complianceResult = complianceValidationService.validate(op, request.newStatus());
            if (!complianceResult.passed()) {
                var messages = complianceResult.errors().stream()
                        .map(e -> e.ruleCode() + ": " + e.message())
                        .toList();
                throw new BusinessException("Compliance validation failed: " + String.join("; ", messages));
            }
        }

        op.status = request.newStatus();

        if (request.newStatus() == OperationStatus.CLOSED) {
            op.closedAt = LocalDateTime.now();
        }

        recordStatusChange(op, previousStatus, request.newStatus(), username, request.comment(), ipAddress);

        auditEvent.fire(new AuditEvent(
                username, AuditAction.STATUS_CHANGE, "Operation", op.id, op.id,
                JsonUtil.toJson(Map.of("status", previousStatus.name())),
                JsonUtil.toJson(Map.of("status", request.newStatus().name())),
                "Status changed from " + previousStatus + " to " + request.newStatus()
        ));

        // Fire approval/rejection audit events for specific transitions
        if (request.newStatus() == OperationStatus.CLOSED) {
            auditEvent.fire(new AuditEvent(
                    username, AuditAction.APPROVAL, "Operation", op.id, op.id,
                    null, JsonUtil.toJson(Map.of("status", request.newStatus().name())),
                    "Operation approved: " + op.referenceNumber + " → " + request.newStatus()
            ));
        } else if (request.newStatus() == OperationStatus.CANCELLED) {
            auditEvent.fire(new AuditEvent(
                    username, AuditAction.REJECTION, "Operation", op.id, op.id,
                    null, JsonUtil.toJson(Map.of("status", request.newStatus().name())),
                    "Operation rejected/cancelled: " + op.referenceNumber
            ));
        }

        notificationService.sendStatusChangeNotification(
                op.id, op.client.email, op.referenceNumber, request.newStatus().name()
        );
    }

    @Transactional
    public void delete(Long id, String username) {
        var op = findById(id);
        if (op.status != OperationStatus.DRAFT) {
            throw new BusinessException("Cannot delete an operation that is not in DRAFT status");
        }

        auditEvent.fire(new AuditEvent(
                username, AuditAction.DELETE, "Operation", op.id, op.id,
                null, null, "Operation deleted: " + op.referenceNumber
        ));

        statusHistoryRepository.deleteByOperationId(id);
        operationRepository.delete(op);
    }

    public List<StatusHistory> getHistory(Long operationId) {
        findById(operationId);
        return statusHistoryRepository.findByOperationId(operationId);
    }

    private void recordStatusChange(Operation op, OperationStatus previous, OperationStatus newStatus,
                                     String username, String comment, String ipAddress) {
        var history = new StatusHistory();
        history.operation = op;
        history.previousStatus = previous;
        history.newStatus = newStatus;
        history.comment = comment;
        history.ipAddress = ipAddress;

        if (username != null) {
            userRepository.findByUsername(username).ifPresent(u -> history.changedBy = u);
        }

        statusHistoryRepository.persist(history);
    }

    private String generateReferenceNumber() {
        var year = Year.now().getValue();
        var seq = operationRepository.getNextSequence();
        return String.format("OP-%d-%05d", year, seq);
    }
}
