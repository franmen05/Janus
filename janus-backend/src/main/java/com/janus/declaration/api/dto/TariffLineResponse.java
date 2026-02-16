package com.janus.declaration.api.dto;

import com.janus.declaration.domain.model.TariffLine;
import java.math.BigDecimal;

public record TariffLineResponse(
        Long id,
        Long declarationId,
        int lineNumber,
        String tariffCode,
        String description,
        BigDecimal quantity,
        BigDecimal unitValue,
        BigDecimal totalValue,
        BigDecimal taxRate,
        BigDecimal taxAmount
) {
    public static TariffLineResponse from(TariffLine t) {
        return new TariffLineResponse(
                t.id, t.declaration.id, t.lineNumber, t.tariffCode, t.description,
                t.quantity, t.unitValue, t.totalValue, t.taxRate, t.taxAmount
        );
    }
}
