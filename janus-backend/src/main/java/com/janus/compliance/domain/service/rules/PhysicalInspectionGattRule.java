package com.janus.compliance.domain.service.rules;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.compliance.domain.service.ComplianceRule;
import com.janus.document.domain.model.Document;
import com.janus.document.domain.model.DocumentStatus;
import com.janus.operation.domain.model.CargoType;
import com.janus.operation.domain.model.InspectionType;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class PhysicalInspectionGattRule implements ComplianceRule {

    @Override
    public boolean appliesTo(OperationStatus from, OperationStatus to, CargoType cargo, InspectionType inspection) {
        return to == OperationStatus.VALUATION_REVIEW && inspection == InspectionType.PHYSICAL;
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
                            "All documents must be VALIDATED before VALUATION_REVIEW for PHYSICAL inspection"
                    )
            ));
        }
        return ValidationResult.success();
    }
}
