package com.janus.compliance.domain.service.rules;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.compliance.domain.service.ComplianceRule;
import com.janus.document.domain.model.Document;
import com.janus.document.domain.model.DocumentStatus;
import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.model.TransportMode;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class PhysicalInspectionGattRule implements ComplianceRule {

    @Override
    public String ruleCode() { return "PHYSICAL_INSPECTION_GATT"; }

    @Override
    public boolean appliesTo(OperationStatus from, OperationStatus to, TransportMode transportMode, OperationCategory category) {
        return to == OperationStatus.VALUATION_REVIEW && category == OperationCategory.CATEGORY_3;
    }

    @Override
    public ValidationResult validate(Operation operation, List<Document> documents) {
        boolean allValidated = documents.stream()
                .filter(d -> d.active)
                .allMatch(d -> d.status == DocumentStatus.VALIDATED);

        if (!allValidated) {
            return ValidationResult.failure(List.of(
                    new ValidationResult.ValidationError(
                            "PHYSICAL_ALL_DOCS_VALIDATED",
                            "All documents must be VALIDATED before VALUATION_REVIEW for CATEGORY_3 operations"
                    )
            ));
        }
        return ValidationResult.success();
    }
}
