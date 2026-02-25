package com.janus.operation.domain.service;

import com.janus.operation.domain.model.OperationStatus;
import com.janus.shared.infrastructure.exception.BusinessException;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Map;
import java.util.Set;

@ApplicationScoped
public class StatusTransitionService {

    private static final Set<OperationStatus> DOCUMENT_UPLOAD_ALLOWED_STATUSES = Set.of(
            OperationStatus.DRAFT,
            OperationStatus.DOCUMENTATION_COMPLETE,
            OperationStatus.IN_REVIEW,
            OperationStatus.PENDING_CORRECTION,
            OperationStatus.PRELIQUIDATION_REVIEW,
            OperationStatus.ANALYST_ASSIGNED,
            OperationStatus.DECLARATION_IN_PROGRESS,
            OperationStatus.SUBMITTED_TO_CUSTOMS,
            OperationStatus.VALUATION_REVIEW,
            OperationStatus.PENDING_EXTERNAL_APPROVAL
    );

    private static final Set<OperationStatus> INTERNAL_REVIEW_STATUSES = Set.of(
            OperationStatus.IN_REVIEW,
            OperationStatus.PENDING_CORRECTION,
            OperationStatus.PRELIQUIDATION_REVIEW,
            OperationStatus.ANALYST_ASSIGNED
    );

    private static final Map<OperationStatus, Set<OperationStatus>> ALLOWED_TRANSITIONS = Map.ofEntries(
            Map.entry(OperationStatus.DRAFT, Set.of(OperationStatus.DOCUMENTATION_COMPLETE, OperationStatus.CANCELLED)),
            Map.entry(OperationStatus.DOCUMENTATION_COMPLETE, Set.of(OperationStatus.IN_REVIEW, OperationStatus.CANCELLED)),
            Map.entry(OperationStatus.IN_REVIEW, Set.of(OperationStatus.PRELIQUIDATION_REVIEW, OperationStatus.PENDING_CORRECTION, OperationStatus.CANCELLED)),
            Map.entry(OperationStatus.PENDING_CORRECTION, Set.of(OperationStatus.IN_REVIEW, OperationStatus.CANCELLED)),
            Map.entry(OperationStatus.PRELIQUIDATION_REVIEW, Set.of(OperationStatus.ANALYST_ASSIGNED, OperationStatus.PENDING_CORRECTION, OperationStatus.CANCELLED)),
            Map.entry(OperationStatus.ANALYST_ASSIGNED, Set.of(OperationStatus.DECLARATION_IN_PROGRESS, OperationStatus.CANCELLED)),
            Map.entry(OperationStatus.DECLARATION_IN_PROGRESS, Set.of(OperationStatus.SUBMITTED_TO_CUSTOMS, OperationStatus.CANCELLED)),
            Map.entry(OperationStatus.SUBMITTED_TO_CUSTOMS, Set.of(OperationStatus.VALUATION_REVIEW, OperationStatus.CANCELLED)),
            Map.entry(OperationStatus.VALUATION_REVIEW, Set.of(OperationStatus.PENDING_EXTERNAL_APPROVAL, OperationStatus.PAYMENT_PREPARATION, OperationStatus.CANCELLED)),
            Map.entry(OperationStatus.PENDING_EXTERNAL_APPROVAL, Set.of(OperationStatus.VALUATION_REVIEW, OperationStatus.CANCELLED)),
            Map.entry(OperationStatus.PAYMENT_PREPARATION, Set.of(OperationStatus.IN_TRANSIT, OperationStatus.CANCELLED)),
            Map.entry(OperationStatus.IN_TRANSIT, Set.of(OperationStatus.CLOSED, OperationStatus.CANCELLED)),
            Map.entry(OperationStatus.CLOSED, Set.of()),
            Map.entry(OperationStatus.CANCELLED, Set.of())
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

    public boolean allowsDocumentUpload(OperationStatus status) {
        return DOCUMENT_UPLOAD_ALLOWED_STATUSES.contains(status);
    }

    public boolean isInternalReviewStatus(OperationStatus status) {
        return INTERNAL_REVIEW_STATUSES.contains(status);
    }

    public Set<OperationStatus> getAllowedTransitions(OperationStatus from) {
        return ALLOWED_TRANSITIONS.getOrDefault(from, Set.of());
    }
}
