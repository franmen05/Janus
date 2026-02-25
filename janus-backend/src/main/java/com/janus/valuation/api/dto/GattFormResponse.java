package com.janus.valuation.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record GattFormResponse(
        Long declarationId,
        String gattMethod,
        Boolean commercialLinks,
        BigDecimal commissions,
        BigDecimal unrecordedTransport,
        BigDecimal adjustmentAmount,
        String justification,
        BigDecimal originalTaxableBase,
        BigDecimal adjustedTaxableBase,
        LocalDateTime completedAt,
        String completedBy,
        boolean required
) {}
