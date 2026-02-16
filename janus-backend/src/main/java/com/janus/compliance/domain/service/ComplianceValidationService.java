package com.janus.compliance.domain.service;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.document.domain.model.Document;
import com.janus.document.domain.repository.DocumentRepository;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class ComplianceValidationService {

    @Inject
    Instance<ComplianceRule> rules;

    @Inject
    DocumentRepository documentRepository;

    public ValidationResult validate(Operation operation, OperationStatus targetStatus) {
        var documents = documentRepository.findByOperationId(operation.id);
        var errors = new ArrayList<ValidationResult.ValidationError>();

        for (var rule : rules) {
            if (rule.appliesTo(operation.status, targetStatus, operation.cargoType, operation.inspectionType)) {
                var result = rule.validate(operation, documents);
                if (!result.passed()) {
                    errors.addAll(result.errors());
                }
            }
        }

        return errors.isEmpty() ? ValidationResult.success() : ValidationResult.failure(errors);
    }
}
