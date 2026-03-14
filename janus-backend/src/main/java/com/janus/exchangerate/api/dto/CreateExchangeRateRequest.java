package com.janus.exchangerate.api.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateExchangeRateRequest(
        @NotNull BigDecimal rate,
        @NotNull LocalDate effectiveDate
) {}
