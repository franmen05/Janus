package com.janus.compliance.domain.service.rules;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.compliance.domain.service.ComplianceRule;
import com.janus.document.domain.model.Document;
import com.janus.document.domain.model.DocumentType;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.model.TransportMode;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class LocalChargesValidatedRule implements ComplianceRule {

    @Override
    public String ruleCode() { return "LOCAL_CHARGES_VALIDATED"; }

    @Override
    public boolean appliesTo(OperationStatus from, OperationStatus to, TransportMode transportMode, OperationCategory category) {
        return to == OperationStatus.PAYMENT_PREPARATION;
    }

    @Override
    public ValidationResult validate(Operation operation, List<Document> documents) {
        // Only applies if a LOCAL_CHARGES_RECEIPT document has been uploaded
        boolean hasLocalChargesDoc = documents.stream()
                .filter(d -> d.active)
                .anyMatch(d -> d.documentType == DocumentType.LOCAL_CHARGES_RECEIPT);

        if (hasLocalChargesDoc && !Boolean.TRUE.equals(operation.localChargesValidated)) {
            return ValidationResult.failure(List.of(
                    new ValidationResult.ValidationError(
                            "LOCAL_CHARGES_NOT_VALIDATED",
                            "Local charges receipt is uploaded but has not been validated"
                    )
            ));
        }
        return ValidationResult.success();
    }
}
