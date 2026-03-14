package com.janus.exchangerate.api.dto;

import com.janus.exchangerate.domain.model.ExchangeRate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ExchangeRateResponse(
        Long id,
        String sourceCurrency,
        String targetCurrency,
        BigDecimal rate,
        LocalDate effectiveDate,
        String source,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ExchangeRateResponse from(ExchangeRate exchangeRate) {
        return new ExchangeRateResponse(
                exchangeRate.id,
                exchangeRate.sourceCurrency,
                exchangeRate.targetCurrency,
                exchangeRate.rate,
                exchangeRate.effectiveDate,
                exchangeRate.source,
                exchangeRate.active,
                exchangeRate.createdAt,
                exchangeRate.updatedAt
        );
    }
}
