package com.janus.compliance.domain.service.rules;

import com.janus.compliance.domain.model.ValidationResult;
import com.janus.compliance.domain.service.ComplianceRule;
import com.janus.document.domain.model.Document;
import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.model.TransportMode;
import com.janus.valuation.api.dto.ValuationChecklistResponse;
import com.janus.valuation.application.ValuationService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class CompletenessForPaymentRule implements ComplianceRule {

    @Inject
    ValuationService valuationService;

    @Override
    public String ruleCode() {
        return "COMPLETENESS_FOR_PAYMENT";
    }

    @Override
    public boolean appliesTo(OperationStatus from, OperationStatus to, TransportMode transportMode, OperationCategory category) {
        return to == OperationStatus.PAYMENT_PREPARATION;
    }

    @Override
    public ValidationResult validate(Operation operation, List<Document> documents) {
        var errors = new ArrayList<ValidationResult.ValidationError>();

        if (operation.id != null) {
            var checklist = valuationService.getChecklist(operation.id);
            if (!checklist.allPassed()) {
                var failedItems = checklist.items().stream()
                        .filter(item -> !item.passed())
                        .map(ValuationChecklistResponse.ChecklistItem::label)
                        .collect(Collectors.joining(", "));
                errors.add(new ValidationResult.ValidationError(
                        "CHECKLIST_INCOMPLETE_FOR_PAYMENT",
                        "Document verification checklist must be complete before advancing to Payment Preparation. Failed items: " + failedItems
                ));
            }
        }

        return errors.isEmpty() ? ValidationResult.success() : ValidationResult.failure(errors);
    }
}
