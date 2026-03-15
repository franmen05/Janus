package com.janus.inspection.api.dto;

import com.janus.inspection.domain.model.ChargeType;
import com.janus.inspection.domain.model.PaymentStatus;
import com.janus.inspection.domain.model.PaymentType;
import com.janus.inspection.domain.model.BillToType;
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
        Boolean reimbursable,
        // New fields
        ChargeType chargeType,
        Integer quantity,
        String units,
        BigDecimal rate,
        PaymentType paymentType,
        BillToType billToType,
        String billToName,
        String invoiceNumber,
        LocalDate invoiceDate,
        String referenceNumber,
        Boolean showOnDocuments,
        Boolean updateRelated,
        String notes
) {}
