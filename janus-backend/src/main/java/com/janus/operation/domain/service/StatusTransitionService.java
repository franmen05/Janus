package com.janus.operation.domain.service;

import com.janus.operation.domain.model.OperationStatus;
import com.janus.shared.infrastructure.exception.BusinessException;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Map;
import java.util.Set;

@ApplicationScoped
public class StatusTransitionService {

    private static final Map<OperationStatus, Set<OperationStatus>> ALLOWED_TRANSITIONS = Map.of(
            OperationStatus.DRAFT, Set.of(OperationStatus.DOCUMENTATION_COMPLETE, OperationStatus.CANCELLED),
            OperationStatus.DOCUMENTATION_COMPLETE, Set.of(OperationStatus.DECLARATION_IN_PROGRESS, OperationStatus.CANCELLED),
            OperationStatus.DECLARATION_IN_PROGRESS, Set.of(OperationStatus.SUBMITTED_TO_CUSTOMS, OperationStatus.CANCELLED),
            OperationStatus.SUBMITTED_TO_CUSTOMS, Set.of(OperationStatus.VALUATION_REVIEW, OperationStatus.CANCELLED),
            OperationStatus.VALUATION_REVIEW, Set.of(OperationStatus.PAYMENT_PREPARATION, OperationStatus.CANCELLED),
            OperationStatus.PAYMENT_PREPARATION, Set.of(OperationStatus.IN_TRANSIT, OperationStatus.CANCELLED),
            OperationStatus.IN_TRANSIT, Set.of(OperationStatus.CLOSED, OperationStatus.CANCELLED),
            OperationStatus.CLOSED, Set.of(),
            OperationStatus.CANCELLED, Set.of()
    );

    public void validateTransition(OperationStatus from, OperationStatus to) {
        var allowed = ALLOWED_TRANSITIONS.getOrDefault(from, Set.of());
        if (!allowed.contains(to)) {
            throw new BusinessException(
                    "Invalid status transition from " + from + " to " + to);
        }
    }

    public boolean isFinalStatus(OperationStatus status) {
        return status == OperationStatus.CLOSED || status == OperationStatus.CANCELLED;
    }
}
