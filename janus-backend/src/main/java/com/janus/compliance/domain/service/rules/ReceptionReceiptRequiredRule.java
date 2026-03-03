package com.janus.compliance.domain.service.rules;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.compliance.domain.service.ComplianceRule;
import com.janus.document.domain.model.Document;
import com.janus.document.domain.model.DocumentType;
import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.model.TransportMode;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class ReceptionReceiptRequiredRule implements ComplianceRule {

    @Override
    public String ruleCode() { return "RECEPTION_RECEIPT_REQUIRED"; }

    @Override
    public boolean appliesTo(OperationStatus from, OperationStatus to, TransportMode transportMode, OperationCategory category) {
        return from == OperationStatus.IN_TRANSIT && to == OperationStatus.CLOSED;
    }

    @Override
    public ValidationResult validate(Operation operation, List<Document> documents) {
        boolean hasReceipt = documents.stream()
                .filter(d -> d.active)
                .anyMatch(d -> d.documentType == DocumentType.RECEPTION_RECEIPT);

        if (!hasReceipt) {
            return ValidationResult.failure(List.of(
                    new ValidationResult.ValidationError(
                            "RECEPTION_RECEIPT_REQUIRED",
                            "A reception receipt must be uploaded before closing the operation"
                    )
            ));
        }
        return ValidationResult.success();
    }
}
