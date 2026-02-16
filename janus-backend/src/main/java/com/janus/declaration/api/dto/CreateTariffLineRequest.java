package com.janus.declaration.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateTariffLineRequest(
        @NotNull Integer lineNumber,
        @NotBlank String tariffCode,
        String description,
        BigDecimal quantity,
        BigDecimal unitValue,
        BigDecimal totalValue,
        BigDecimal taxRate,
        BigDecimal taxAmount
) {}
