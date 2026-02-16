package com.janus.operation.application;

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
import com.janus.shared.infrastructure.exception.BusinessException;
import com.janus.shared.infrastructure.exception.NotFoundException;
import com.janus.user.domain.model.User;
import com.janus.user.domain.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;

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
        op.notes = request.notes();

        if (request.assignedAgentId() != null) {
            op.assignedAgent = userRepository.findByIdOptional(request.assignedAgentId())
                    .orElseThrow(() -> new NotFoundException("User", request.assignedAgentId()));
        }

        operationRepository.persist(op);

        recordStatusChange(op, null, OperationStatus.DRAFT, username, "Operation created", null);

        return op;
    }

    @Transactional
    public Operation update(Long id, CreateOperationRequest request) {
        var op = findById(id);

        if (statusTransitionService.isFinalStatus(op.status)) {
            throw new BusinessException("Cannot update a closed or cancelled operation");
        }

        op.client = clientRepository.findByIdOptional(request.clientId())
                .orElseThrow(() -> new NotFoundException("Client", request.clientId()));
        op.cargoType = request.cargoType();
        op.inspectionType = request.inspectionType();
        op.notes = request.notes();

        if (request.assignedAgentId() != null) {
            op.assignedAgent = userRepository.findByIdOptional(request.assignedAgentId())
                    .orElseThrow(() -> new NotFoundException("User", request.assignedAgentId()));
        }

        return op;
    }

    @Transactional
    public void changeStatus(Long id, ChangeStatusRequest request, String username, String ipAddress) {
        var op = findById(id);
        var previousStatus = op.status;

        statusTransitionService.validateTransition(previousStatus, request.newStatus());

        op.status = request.newStatus();

        if (request.newStatus() == OperationStatus.CLOSED) {
            op.closedAt = LocalDateTime.now();
        }

        recordStatusChange(op, previousStatus, request.newStatus(), username, request.comment(), ipAddress);

        notificationService.sendStatusChangeNotification(
                op.id, op.client.email, op.referenceNumber, request.newStatus().name()
        );
    }

    @Transactional
    public void delete(Long id) {
        var op = findById(id);
        if (op.status != OperationStatus.DRAFT) {
            throw new BusinessException("Cannot delete an operation that is not in DRAFT status");
        }
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
