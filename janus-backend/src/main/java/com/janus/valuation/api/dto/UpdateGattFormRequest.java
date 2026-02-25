package com.janus.valuation.api.dto;

import java.math.BigDecimal;

public record UpdateGattFormRequest(
        Boolean commercialLinks,
        BigDecimal commissions,
        BigDecimal unrecordedTransport,
        BigDecimal adjustmentAmount,
        String justification
) {}
