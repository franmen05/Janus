package com.janus.payment.api.dto;

import com.janus.payment.domain.model.Payment;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        Long operationId,
        Long liquidationId,
        BigDecimal amount,
        String paymentMethod,
        LocalDate paymentDate,
        String dgaReference,
        String bankReference,
        String notes,
        String registeredBy,
        LocalDateTime createdAt
) {
    public static PaymentResponse from(Payment p) {
        return new PaymentResponse(
                p.id,
                p.operation != null ? p.operation.id : null,
                p.liquidation != null ? p.liquidation.id : null,
                p.amount,
                p.paymentMethod != null ? p.paymentMethod.name() : null,
                p.paymentDate,
                p.dgaReference,
                p.bankReference,
                p.notes,
                p.registeredBy,
                p.createdAt
        );
    }
}
