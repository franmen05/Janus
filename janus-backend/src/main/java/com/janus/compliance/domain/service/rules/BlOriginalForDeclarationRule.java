package com.janus.compliance.domain.service.rules;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.compliance.domain.service.ComplianceRule;
import com.janus.document.domain.model.Document;
import com.janus.operation.domain.model.BlAvailability;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.model.TransportMode;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class BlOriginalForDeclarationRule implements ComplianceRule {

    @Override
    public String ruleCode() { return "BL_ORIGINAL_NOT_AVAILABLE"; }

    @Override
    public boolean appliesTo(OperationStatus from, OperationStatus to, TransportMode transportMode, OperationCategory category) {
        return to == OperationStatus.PAYMENT_PREPARATION
                || to == OperationStatus.IN_TRANSIT
                || to == OperationStatus.CLOSED;
    }

    @Override
    public ValidationResult validate(Operation operation, List<Document> documents) {
        if (operation.blAvailability == null || operation.blAvailability == BlAvailability.NOT_AVAILABLE) {
            return ValidationResult.failure(
                List.of(
                    new ValidationResult.ValidationError(
                            "BL_ORIGINAL_NOT_AVAILABLE",
                            "BL must be available (ORIGINAL or ENDORSED) to proceed to declaration"
                    )
                )
            );
        }
        return ValidationResult.success();
    }
}
