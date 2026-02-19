package com.janus.compliance.domain.service.rules;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.compliance.domain.service.ComplianceRule;
import com.janus.document.domain.model.Document;
import com.janus.document.domain.model.DocumentStatus;
import com.janus.document.domain.model.DocumentType;
import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.model.TransportMode;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class CommercialInvoiceRequiredRule implements ComplianceRule {

    @Override
    public String ruleCode() { return "COMMERCIAL_INVOICE_REQUIRED"; }

    @Override
    public boolean appliesTo(OperationStatus from, OperationStatus to, TransportMode transportMode, OperationCategory category) {
        return to == OperationStatus.DECLARATION_IN_PROGRESS && category == OperationCategory.CATEGORY_1;
    }

    @Override
    public ValidationResult validate(Operation operation, List<Document> documents) {
        boolean hasValidatedInvoice = documents.stream()
                .filter(d -> d.active)
                .filter(d -> d.documentType == DocumentType.COMMERCIAL_INVOICE)
                .anyMatch(d -> d.status == DocumentStatus.VALIDATED);

        if (!hasValidatedInvoice) {
            return ValidationResult.failure(List.of(
                    new ValidationResult.ValidationError(
                            "INVOICE_NOT_VALIDATED",
                            "Commercial invoice must be VALIDATED before DECLARATION_IN_PROGRESS"
                    )
            ));
        }
        return ValidationResult.success();
    }
}
