package com.janus.declaration.api.dto;

import java.math.BigDecimal;

public record CreateDeclarationRequest(
        String declarationNumber,
        BigDecimal fobValue,
        BigDecimal cifValue,
        BigDecimal taxableBase,
        BigDecimal totalTaxes,
        BigDecimal freightValue,
        BigDecimal insuranceValue,
        String gattMethod,
        String notes
) {}
