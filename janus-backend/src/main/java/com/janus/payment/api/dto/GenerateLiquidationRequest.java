package com.janus.payment.api.dto;

import java.math.BigDecimal;

public record GenerateLiquidationRequest(
        BigDecimal agencyServiceFee
) {}
