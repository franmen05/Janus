package com.janus.compliance.domain.service.rules;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.compliance.domain.service.ComplianceRule;
import com.janus.document.domain.model.Document;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.model.TransportMode;
import com.janus.valuation.domain.repository.ExternalPermitRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;

@ApplicationScoped
public class ExternalPermitsClearedRule implements ComplianceRule {

    @Inject
    ExternalPermitRepository permitRepository;

    @Override
    public String ruleCode() { return "EXTERNAL_PERMITS_CLEARED"; }

    @Override
    public boolean appliesTo(OperationStatus from, OperationStatus to, TransportMode transportMode, OperationCategory category) {
        return to == OperationStatus.PAYMENT_PREPARATION;
    }

    @Override
    public ValidationResult validate(Operation operation, List<Document> documents) {
        if (permitRepository.hasBlockingPermits(operation.id)) {
            return ValidationResult.failure(List.of(
                    new ValidationResult.ValidationError(
                            "PERMITS_PENDING",
                            "All external permits must be cleared (not EN_TRAMITE) before advancing to Payment Preparation"
                    )
            ));
        }
        return ValidationResult.success();
    }
}
