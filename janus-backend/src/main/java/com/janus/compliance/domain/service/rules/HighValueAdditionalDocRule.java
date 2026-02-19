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
public class HighValueAdditionalDocRule implements ComplianceRule {

    @Override
    public String ruleCode() { return "HIGH_VALUE_ADDITIONAL_DOC"; }

    @Override
    public boolean appliesTo(OperationStatus from, OperationStatus to, TransportMode transportMode, OperationCategory category) {
        return to == OperationStatus.DOCUMENTATION_COMPLETE && transportMode == TransportMode.MARITIME;
    }

    @Override
    public ValidationResult validate(Operation operation, List<Document> documents) {
        boolean hasCertificate = documents.stream()
                .filter(d -> d.active)
                .anyMatch(d -> d.documentType == DocumentType.CERTIFICATE);

        if (!hasCertificate) {
            return ValidationResult.failure(List.of(
                    new ValidationResult.ValidationError(
                            "HIGH_VALUE_CERT_REQUIRED",
                            "MARITIME operations require a CERTIFICATE document"
                    )
            ));
        }
        return ValidationResult.success();
    }
}
