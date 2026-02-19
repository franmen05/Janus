package com.janus.compliance.domain.service.rules;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.compliance.domain.service.ComplianceRule;
import com.janus.document.domain.model.Document;
import com.janus.document.domain.service.DocumentCompletenessService;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.model.TransportMode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class InternalReviewCompleteRule implements ComplianceRule {

    @Inject
    DocumentCompletenessService completenessService;

    @Override
    public String ruleCode() {
        return "INTERNAL_REVIEW_COMPLETE";
    }

    @Override
    public boolean appliesTo(OperationStatus from, OperationStatus to, TransportMode transportMode, OperationCategory category) {
        return from == OperationStatus.IN_REVIEW && to == OperationStatus.PRELIQUIDATION_REVIEW;
    }

    @Override
    public ValidationResult validate(Operation operation, List<Document> documents) {
        var errors = new ArrayList<ValidationResult.ValidationError>();

        // Check completeness is 100%
        if (operation.id != null) {
            var completeness = completenessService.calculate(operation.id);
            if (completeness.percentage() < 100) {
                errors.add(new ValidationResult.ValidationError(
                        "INCOMPLETE_DOCS",
                        "Document completeness must be 100% to proceed. Current: " + completeness.percentage() + "%"
                ));
            }
        }

        // Check BL original is available
        if (operation.blOriginalAvailable == null || !operation.blOriginalAvailable) {
            errors.add(new ValidationResult.ValidationError(
                    "BL_NOT_VALIDATED",
                    "Original BL must be available to proceed to preliquidation review"
            ));
        }

        return errors.isEmpty() ? ValidationResult.success() : ValidationResult.failure(errors);
    }
}
