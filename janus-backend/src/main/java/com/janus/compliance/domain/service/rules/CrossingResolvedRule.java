package com.janus.compliance.domain.service.rules;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.compliance.domain.service.ComplianceRule;
import com.janus.declaration.domain.repository.CrossingResultRepository;
import com.janus.document.domain.model.Document;
import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.model.TransportMode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;

@ApplicationScoped
public class CrossingResolvedRule implements ComplianceRule {

    @Inject
    CrossingResultRepository crossingResultRepository;

    @Override
    public String ruleCode() { return "CROSSING_RESOLVED"; }

    @Override
    public boolean appliesTo(OperationStatus from, OperationStatus to, TransportMode transportMode, OperationCategory category) {
        return from == OperationStatus.SUBMITTED_TO_CUSTOMS && to == OperationStatus.VALUATION_REVIEW;
    }

    @Override
    public ValidationResult validate(Operation operation, List<Document> documents) {
        if (crossingResultRepository.hasUnresolvedForOperation(operation.id)) {
            return ValidationResult.failure(List.of(
                    new ValidationResult.ValidationError(
                            "CROSSING_UNRESOLVED",
                            "Crossing discrepancies must be resolved before moving to VALUATION_REVIEW"
                    )
            ));
        }
        return ValidationResult.success();
    }
}
