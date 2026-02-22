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
        LocalDateTime createdAt
) {
    public static InspectionExpenseResponse from(InspectionExpense expense) {
        return new InspectionExpenseResponse(
                expense.id,
                expense.operation != null ? expense.operation.id : null,
                expense.registeredBy != null ? expense.registeredBy.username : null,
                expense.registeredBy != null ? expense.registeredBy.fullName : null,
                expense.category != null ? expense.category.name() : null,
                expense.description,
                expense.amount,
                expense.currency,
                expense.expenseDate,
                expense.justification,
                expense.createdAt
        );
    }
}
