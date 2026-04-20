package com.janus.compliance.domain.service.rules;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.compliance.domain.service.ComplianceRule;
import com.janus.document.domain.model.Document;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.model.TransportMode;
import com.janus.payment.domain.model.Liquidation;
import com.janus.payment.domain.model.LiquidationStatus;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class LiquidationPaidForClosingRule implements ComplianceRule {

    @Override
    public String ruleCode() {
        return "LIQUIDATION_PAID_FOR_CLOSING";
    }

    @Override
    public boolean appliesTo(OperationStatus from, OperationStatus to, TransportMode transportMode, OperationCategory category) {
        return to == OperationStatus.CLOSED;
    }

    @Override
    public ValidationResult validate(Operation operation, List<Document> documents) {
        Liquidation liquidation = Liquidation.find("operation.id = ?1", operation.id).firstResult();

        if (liquidation == null) {
            return ValidationResult.failure(List.of(
                    new ValidationResult.ValidationError(
                            "LIQUIDATION_PAID_FOR_CLOSING",
                            "No liquidation found for this operation. A paid liquidation is required to close the operation."
                    )
            ));
        }

        if (liquidation.status != LiquidationStatus.PAID && liquidation.status != LiquidationStatus.APPROVED) {
            return ValidationResult.failure(List.of(
                    new ValidationResult.ValidationError(
                            "LIQUIDATION_PAID_FOR_CLOSING",
                            "Liquidation must be APPROVED or PAID before closing the operation. Current status: " + liquidation.status
                    )
            ));
        }

        return ValidationResult.success();
    }
}
