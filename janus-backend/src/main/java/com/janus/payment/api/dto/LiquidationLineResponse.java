package com.janus.payment.api.dto;

import com.janus.payment.domain.model.LiquidationLine;
import java.math.BigDecimal;

public record LiquidationLineResponse(
        Long id,
        String concept,
        String description,
        BigDecimal baseAmount,
        BigDecimal rate,
        BigDecimal amount,
        int lineOrder,
        boolean reimbursable
) {
    public static LiquidationLineResponse from(LiquidationLine l) {
        return new LiquidationLineResponse(
                l.id,
                l.concept,
                l.description,
                l.baseAmount,
                l.rate,
                l.amount,
                l.lineOrder,
                l.reimbursable
        );
    }
}
