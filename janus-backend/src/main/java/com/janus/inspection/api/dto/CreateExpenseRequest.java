package com.janus.inspection.api.dto;

import com.janus.inspection.domain.model.PaymentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateExpenseRequest(
        @NotBlank String category,
        String description,
        @NotNull BigDecimal amount,
        String currency,
        LocalDate expenseDate,
        String justification,
        String responsable,
        PaymentStatus paymentStatus,
        Boolean reimbursable
) {}
