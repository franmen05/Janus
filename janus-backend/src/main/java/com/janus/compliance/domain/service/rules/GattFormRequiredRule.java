package com.janus.compliance.domain.service.rules;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.compliance.domain.service.ComplianceRule;
import com.janus.declaration.domain.repository.DeclarationRepository;
import com.janus.document.domain.model.Document;
import com.janus.operation.domain.model.InspectionType;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.model.TransportMode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;

@ApplicationScoped
public class GattFormRequiredRule implements ComplianceRule {

    @Inject
    DeclarationRepository declarationRepository;

    @Override
    public String ruleCode() { return "GATT_FORM_REQUIRED"; }

    @Override
    public boolean appliesTo(OperationStatus from, OperationStatus to, TransportMode transportMode, OperationCategory category) {
        return to == OperationStatus.PAYMENT_PREPARATION;
    }

    @Override
    public ValidationResult validate(Operation operation, List<Document> documents) {
        // Only required when inspection was VISUAL or FISICA
        if (operation.inspectionType != InspectionType.VISUAL && operation.inspectionType != InspectionType.FISICA) {
            return ValidationResult.success();
        }

        var declarations = declarationRepository.findByOperationId(operation.id);
        boolean gattCompleted = declarations.stream()
                .anyMatch(d -> d.gattCompletedAt != null);

        if (!gattCompleted) {
            return ValidationResult.failure(List.of(
                    new ValidationResult.ValidationError(
                            "GATT_FORM_INCOMPLETE",
                            "GATT Article 1 form must be completed before advancing to Payment Preparation (inspection type: " + operation.inspectionType + ")"
                    )
            ));
        }
        return ValidationResult.success();
    }
}
