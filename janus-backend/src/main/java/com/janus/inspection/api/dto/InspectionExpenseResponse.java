package com.janus.inspection.api.dto;

import com.janus.inspection.domain.model.InspectionExpense;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record InspectionExpenseResponse(
        Long id,
        Long operationId,
        String registeredByUsername,
        String registeredByFullName,
        String category,
        String description,
        BigDecimal amount,
        String currency,
        LocalDate expenseDate,
        String justification,
        String responsable,
        String paymentStatus,
        boolean reimbursable,
        LocalDateTime createdAt,
        // New fields
        String chargeType,
        int quantity,
        String units,
        BigDecimal rate,
        String paymentType,
        String billToType,
        String billToName,
        String invoiceNumber,
        LocalDate invoiceDate,
        String referenceNumberCharge,
        boolean showOnDocuments,
        boolean updateRelated,
        String notes
) {
    public static InspectionExpenseResponse from(InspectionExpense expense) {
        return new InspectionExpenseResponse(
                expense.id,
                expense.operation != null ? expense.operation.id : null,
                expense.registeredBy != null ? expense.registeredBy.username : null,
                expense.registeredBy != null ? expense.registeredBy.fullName : null,
                expense.category,
                expense.description,
                expense.amount,
                expense.currency,
                expense.expenseDate,
                expense.justification,
                expense.responsable,
                expense.paymentStatus != null ? expense.paymentStatus.name() : null,
                expense.reimbursable,
                expense.createdAt,
                expense.chargeType != null ? expense.chargeType.name() : null,
                expense.quantity,
                expense.units,
                expense.rate,
                expense.paymentType != null ? expense.paymentType.name() : null,
                expense.billToType != null ? expense.billToType.name() : null,
                expense.billToName,
                expense.invoiceNumber,
                expense.invoiceDate,
                expense.referenceNumberCharge,
                expense.showOnDocuments,
                expense.updateRelated,
                expense.notes
        );
    }
}
