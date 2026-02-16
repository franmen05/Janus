package com.janus.compliance.domain.service.rules;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.compliance.domain.service.ComplianceRule;
import com.janus.document.domain.model.Document;
import com.janus.document.domain.model.DocumentType;
import com.janus.operation.domain.model.CargoType;
import com.janus.operation.domain.model.InspectionType;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@ApplicationScoped
public class CompletenessRequiredRule implements ComplianceRule {

    private static final Set<DocumentType> MANDATORY = Set.of(
            DocumentType.BL, DocumentType.COMMERCIAL_INVOICE, DocumentType.PACKING_LIST
    );

    @Override
    public boolean appliesTo(OperationStatus from, OperationStatus to, CargoType cargo, InspectionType inspection) {
        return to == OperationStatus.DOCUMENTATION_COMPLETE;
    }

    @Override
    public ValidationResult validate(Operation operation, List<Document> documents) {
        var present = documents.stream()
                .filter(d -> d.active)
                .map(d -> d.documentType)
                .collect(java.util.stream.Collectors.toSet());

        var errors = new ArrayList<ValidationResult.ValidationError>();
        for (var mandatory : MANDATORY) {
            if (!present.contains(mandatory)) {
                errors.add(new ValidationResult.ValidationError(
                        "MISSING_DOC_" + mandatory.name(),
                        "Required document missing: " + mandatory.name()
                ));
            }
        }
        return errors.isEmpty() ? ValidationResult.success() : ValidationResult.failure(errors);
    }
}
