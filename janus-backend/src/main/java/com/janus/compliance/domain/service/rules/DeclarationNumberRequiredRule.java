package com.janus.compliance.domain.service.rules;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.compliance.domain.service.ComplianceRule;
import com.janus.declaration.domain.model.DeclarationType;
import com.janus.declaration.domain.repository.DeclarationRepository;
import com.janus.document.domain.model.Document;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.model.TransportMode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;

@ApplicationScoped
public class DeclarationNumberRequiredRule implements ComplianceRule {

    @Inject
    DeclarationRepository declarationRepository;

    @Override
    public String ruleCode() {
        return "DECLARATION_NUMBER_REQUIRED";
    }

    @Override
    public boolean appliesTo(OperationStatus from, OperationStatus to, TransportMode transportMode, OperationCategory category) {
        return to == OperationStatus.SUBMITTED_TO_CUSTOMS;
    }

    @Override
    public ValidationResult validate(Operation operation, List<Document> documents) {
        var declarations = declarationRepository.findByOperationId(operation.id);
        var preliminary = declarations.stream()
                .filter(d -> d.declarationType == DeclarationType.PRELIMINARY)
                .findFirst();

        if (preliminary.isEmpty() || preliminary.get().declarationNumber == null
                || preliminary.get().declarationNumber.isBlank()) {
            return ValidationResult.failure(List.of(
                    new ValidationResult.ValidationError(
                            "DECLARATION_NUMBER_MISSING",
                            "Preliminary declaration must have a declaration number before advancing to Submitted to Customs"
                    )
            ));
        }

        return ValidationResult.success();
    }
}
