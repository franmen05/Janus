package com.janus.inspection.api.dto;

import com.janus.inspection.domain.model.ExpenseCategory;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateExpenseRequest(
        @NotNull ExpenseCategory category,
        String description,
        @NotNull BigDecimal amount,
        String currency,
        LocalDate expenseDate,
        String justification
) {}
