package com.janus.compliance.domain.service.rules;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.compliance.domain.service.ComplianceRule;
import com.janus.document.domain.model.Document;
import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.model.TransportMode;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class InspectionTypeRequiredRule implements ComplianceRule {

    @Override
    public String ruleCode() {
        return "INSPECTION_TYPE_REQUIRED";
    }

    @Override
    public boolean appliesTo(OperationStatus from, OperationStatus to, TransportMode transportMode, OperationCategory category) {
        return from == OperationStatus.SUBMITTED_TO_CUSTOMS && to == OperationStatus.VALUATION_REVIEW;
    }

    @Override
    public ValidationResult validate(Operation operation, List<Document> documents) {
        if (operation.inspectionType == null) {
            return ValidationResult.failure(List.of(
                    new ValidationResult.ValidationError(
                            "INSPECTION_TYPE_MISSING",
                            "Inspection type must be set before advancing to VALUATION_REVIEW"
                    )
            ));
        }
        return ValidationResult.success();
    }
}
