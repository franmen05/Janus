package com.janus.compliance.domain.service.rules;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.compliance.domain.repository.ComplianceRuleConfigRepository;
import com.janus.compliance.domain.service.ComplianceRule;
import com.janus.document.domain.model.Document;
import com.janus.operation.domain.model.CargoType;
import com.janus.operation.domain.model.InspectionType;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class RestrictedCountryRule implements ComplianceRule {

    private static final Set<String> DEFAULT_RESTRICTED = Set.of("CU", "KP", "IR", "SY", "VE");

    @Inject
    ComplianceRuleConfigRepository configRepository;

    @Override
    public String ruleCode() { return "RESTRICTED_COUNTRY"; }

    @Override
    public boolean appliesTo(OperationStatus from, OperationStatus to, CargoType cargo, InspectionType inspection) {
        return to == OperationStatus.DOCUMENTATION_COMPLETE
                || to == OperationStatus.DECLARATION_IN_PROGRESS;
    }

    @Override
    public ValidationResult validate(Operation operation, List<Document> documents) {
        if (operation.originCountry == null || operation.originCountry.isBlank()) {
            return ValidationResult.success();
        }

        var restricted = getRestrictedCountries();
        if (restricted.contains(operation.originCountry.toUpperCase())) {
            return ValidationResult.failure(List.of(
                    new ValidationResult.ValidationError(
                            "RESTRICTED_COUNTRY",
                            "Origin country " + operation.originCountry + " is restricted — additional review required"
                    )
            ));
        }
        return ValidationResult.success();
    }

    private Set<String> getRestrictedCountries() {
        return configRepository.getParamValue(ruleCode(), "restricted_countries")
                .map(value -> Arrays.stream(value.split(","))
                        .map(String::trim)
                        .map(String::toUpperCase)
                        .collect(Collectors.toSet()))
                .orElse(DEFAULT_RESTRICTED);
    }
}
