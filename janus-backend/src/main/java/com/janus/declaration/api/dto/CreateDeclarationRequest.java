package com.janus.declaration.api.dto;

import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;

public record CreateDeclarationRequest(
        String declarationNumber,
        @DecimalMin(value = "0.01", message = "FOB value must be greater than 0")
        BigDecimal fobValue,
        BigDecimal cifValue,
        BigDecimal taxableBase,
        BigDecimal totalTaxes,
        BigDecimal freightValue,
        BigDecimal insuranceValue,
        BigDecimal fobValueUsd,
        BigDecimal freightValueUsd,
        BigDecimal insuranceValueUsd,
        BigDecimal exchangeRate,
        String gattMethod,
        String notes
) {}
