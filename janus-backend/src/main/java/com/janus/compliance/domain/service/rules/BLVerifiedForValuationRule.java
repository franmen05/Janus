package com.janus.compliance.domain.service.rules;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.compliance.domain.service.ComplianceRule;
import com.janus.document.domain.model.Document;
import com.janus.document.domain.model.DocumentStatus;
import com.janus.document.domain.model.DocumentType;
import com.janus.operation.domain.model.CargoType;
import com.janus.operation.domain.model.InspectionType;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class BLVerifiedForValuationRule implements ComplianceRule {

    @Override
    public boolean appliesTo(OperationStatus from, OperationStatus to, CargoType cargo, InspectionType inspection) {
        return to == OperationStatus.VALUATION_REVIEW;
    }

    @Override
    public ValidationResult validate(Operation operation, List<Document> documents) {
        boolean blValidated = documents.stream()
                .filter(d -> d.active)
                .filter(d -> d.documentType == DocumentType.BL)
                .anyMatch(d -> d.status == DocumentStatus.VALIDATED);

        if (!blValidated) {
            return ValidationResult.failure(List.of(
                    new ValidationResult.ValidationError(
                            "BL_NOT_VALIDATED",
                            "Bill of Lading must be VALIDATED before VALUATION_REVIEW"
                    )
            ));
        }
        return ValidationResult.success();
    }
}
