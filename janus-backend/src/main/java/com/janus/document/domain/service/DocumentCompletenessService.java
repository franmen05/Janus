package com.janus.document.domain.service;

import com.janus.compliance.domain.repository.ComplianceRuleConfigRepository;
import com.janus.document.domain.model.DocumentType;
import com.janus.document.domain.repository.DocumentRepository;
import com.janus.operation.domain.model.CargoType;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.repository.OperationRepository;
import com.janus.shared.infrastructure.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class DocumentCompletenessService {

    private static final Set<DocumentType> DEFAULT_MANDATORY = Set.of(
            DocumentType.BL,
            DocumentType.COMMERCIAL_INVOICE,
            DocumentType.PACKING_LIST
    );

    @Inject
    DocumentRepository documentRepository;

    @Inject
    OperationRepository operationRepository;

    @Inject
    ComplianceRuleConfigRepository configRepository;

    public CompletenessResult calculate(Long operationId) {
        var operation = operationRepository.findByIdOptional(operationId)
                .orElseThrow(() -> new NotFoundException("Operation", operationId));

        var mandatory = getEffectiveMandatoryDocuments(operation.cargoType);

        if (mandatory.isEmpty()) {
            return new CompletenessResult(100, List.of(), "GREEN");
        }

        var presentTypes = new HashSet<DocumentType>();
        var docs = documentRepository.findByOperationId(operationId);
        docs.forEach(d -> presentTypes.add(d.documentType));

        var missing = new ArrayList<DocumentType>();
        for (var doc : mandatory) {
            if (!presentTypes.contains(doc)) {
                missing.add(doc);
            }
        }

        int total = mandatory.size();
        int present = total - missing.size();
        int percentage = total > 0 ? (int) ((present * 100.0) / total) : 100;

        String color;
        if (percentage == 100) {
            color = "GREEN";
        } else if (percentage >= 50) {
            color = "YELLOW";
        } else {
            color = "RED";
        }

        return new CompletenessResult(percentage, missing, color);
    }

    /**
     * Aggregates mandatory documents from all enabled compliance rules.
     */
    private Set<DocumentType> getEffectiveMandatoryDocuments(CargoType cargoType) {
        var mandatory = new HashSet<DocumentType>();

        if (configRepository.isRuleEnabled("COMPLETENESS_REQUIRED")) {
            mandatory.addAll(getMandatoryFromConfig(cargoType));
        }

        if (configRepository.isRuleEnabled("HIGH_VALUE_ADDITIONAL_DOC") && cargoType == CargoType.FCL) {
            mandatory.add(DocumentType.CERTIFICATE);
        }

        return mandatory;
    }

    private Set<DocumentType> getMandatoryFromConfig(CargoType cargoType) {
        var key = "mandatory_documents_" + cargoType.name();
        return configRepository.getParamValue("COMPLETENESS_REQUIRED", key)
                .map(value -> Arrays.stream(value.split(","))
                        .map(String::trim)
                        .map(DocumentType::valueOf)
                        .collect(Collectors.toSet()))
                .orElse(DEFAULT_MANDATORY);
    }

    public record CompletenessResult(
            int percentage,
            List<DocumentType> missingDocuments,
            String color
    ) {}
}
