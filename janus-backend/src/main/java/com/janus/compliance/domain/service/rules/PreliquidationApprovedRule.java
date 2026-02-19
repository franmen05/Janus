package com.janus.compliance.domain.service.rules;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.compliance.domain.service.ComplianceRule;
import com.janus.declaration.domain.repository.DeclarationRepository;
import com.janus.document.domain.model.Document;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.model.TransportMode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class PreliquidationApprovedRule implements ComplianceRule {

    @Inject
    DeclarationRepository declarationRepository;

    @Override
    public String ruleCode() {
        return "PRELIQUIDATION_APPROVED";
    }

    @Override
    public boolean appliesTo(OperationStatus from, OperationStatus to, TransportMode transportMode, OperationCategory category) {
        return from == OperationStatus.PRELIQUIDATION_REVIEW && to == OperationStatus.ANALYST_ASSIGNED;
    }

    @Override
    public ValidationResult validate(Operation operation, List<Document> documents) {
        var errors = new ArrayList<ValidationResult.ValidationError>();

        if (operation.id == null) {
            errors.add(new ValidationResult.ValidationError(
                    "NO_OPERATION_ID",
                    "Operation must be persisted"
            ));
            return ValidationResult.failure(errors);
        }

        var declarations = declarationRepository.findByOperationId(operation.id);
        if (declarations.isEmpty()) {
            errors.add(new ValidationResult.ValidationError(
                    "NO_DECLARATION",
                    "At least one declaration is required for preliquidation approval"
            ));
            return ValidationResult.failure(errors);
        }

        // Check if any declaration has both technical and final approval
        boolean hasTechnicalApproval = declarations.stream().anyMatch(d -> d.technicalApprovedBy != null);
        boolean hasFinalApproval = declarations.stream().anyMatch(d -> d.finalApprovedBy != null);

        if (!hasTechnicalApproval) {
            errors.add(new ValidationResult.ValidationError(
                    "MISSING_TECHNICAL_APPROVAL",
                    "Technical approval is required before assigning analyst"
            ));
        }

        if (!hasFinalApproval) {
            errors.add(new ValidationResult.ValidationError(
                    "MISSING_FINAL_APPROVAL",
                    "Final (ADMIN) approval is required before assigning analyst"
            ));
        }

        return errors.isEmpty() ? ValidationResult.success() : ValidationResult.failure(errors);
    }
}
