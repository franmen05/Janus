package com.janus.payment.api.dto;

import com.janus.payment.domain.model.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record RegisterPaymentRequest(
        @NotNull BigDecimal amount,
        @NotNull PaymentMethod paymentMethod,
        @NotNull LocalDate paymentDate,
        String dgaReference,
        String bankReference,
        String notes
) {}
