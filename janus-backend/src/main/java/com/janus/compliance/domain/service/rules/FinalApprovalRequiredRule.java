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
public class FinalApprovalRequiredRule implements ComplianceRule {

    @Inject
    DeclarationRepository declarationRepository;

    @Override
    public String ruleCode() {
        return "FINAL_APPROVAL_REQUIRED";
    }

    @Override
    public boolean appliesTo(OperationStatus from, OperationStatus to, TransportMode transportMode, OperationCategory category) {
        return from == OperationStatus.DECLARATION_IN_PROGRESS && to == OperationStatus.SUBMITTED_TO_CUSTOMS;
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
                    "At least one declaration is required"
            ));
            return ValidationResult.failure(errors);
        }

        // Check if any declaration has final approval
        boolean hasFinalApproval = declarations.stream().anyMatch(d -> d.finalApprovedBy != null);

        if (!hasFinalApproval) {
            errors.add(new ValidationResult.ValidationError(
                    "MISSING_FINAL_APPROVAL",
                    "Final (ADMIN) approval is required before submitting to customs"
            ));
        }

        return errors.isEmpty() ? ValidationResult.success() : ValidationResult.failure(errors);
    }
}
