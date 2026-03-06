package com.janus.inspection.api.dto;

import com.janus.inspection.domain.model.ExpenseCategory;
import com.janus.inspection.domain.model.PaymentStatus;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateExpenseRequest(
        @NotNull ExpenseCategory category,
        String description,
        @NotNull BigDecimal amount,
        String currency,
        LocalDate expenseDate,
        String justification,
        String responsable,
        PaymentStatus paymentStatus,
        Boolean reimbursable
) {}
