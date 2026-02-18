package com.janus.compliance.domain.service.rules;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.compliance.domain.repository.ComplianceRuleConfigRepository;
import com.janus.compliance.domain.service.ComplianceRule;
import com.janus.document.domain.model.Document;
import com.janus.document.domain.model.DocumentType;
import com.janus.operation.domain.model.CargoType;
import com.janus.operation.domain.model.InspectionType;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class CompletenessRequiredRule implements ComplianceRule {

    private static final Set<DocumentType> DEFAULT_MANDATORY = Set.of(
            DocumentType.BL, DocumentType.COMMERCIAL_INVOICE, DocumentType.PACKING_LIST
    );

    @Inject
    ComplianceRuleConfigRepository configRepository;

    @Override
    public String ruleCode() { return "COMPLETENESS_REQUIRED"; }

    @Override
    public boolean appliesTo(OperationStatus from, OperationStatus to, CargoType cargo, InspectionType inspection) {
        return to == OperationStatus.DOCUMENTATION_COMPLETE;
    }

    @Override
    public ValidationResult validate(Operation operation, List<Document> documents) {
        var mandatory = getMandatoryDocuments(operation.cargoType);

        var present = documents.stream()
                .filter(d -> d.active)
                .map(d -> d.documentType)
                .collect(Collectors.toSet());

        var errors = new ArrayList<ValidationResult.ValidationError>();
        for (var doc : mandatory) {
            if (!present.contains(doc)) {
                errors.add(new ValidationResult.ValidationError(
                        "MISSING_DOC_" + doc.name(),
                        "Required document missing: " + doc.name()
                ));
            }
        }
        return errors.isEmpty() ? ValidationResult.success() : ValidationResult.failure(errors);
    }

    private Set<DocumentType> getMandatoryDocuments(CargoType cargoType) {
        var key = "mandatory_documents_" + cargoType.name();
        return configRepository.getParamValue(ruleCode(), key)
                .map(value -> Arrays.stream(value.split(","))
                        .map(String::trim)
                        .map(DocumentType::valueOf)
                        .collect(Collectors.toSet()))
                .orElse(DEFAULT_MANDATORY);
    }
}
