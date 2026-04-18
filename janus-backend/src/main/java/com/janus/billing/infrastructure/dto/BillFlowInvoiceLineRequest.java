package com.janus.billing.infrastructure.dto;

import java.math.BigDecimal;

public record BillFlowInvoiceLineRequest(
    String description,
    int quantity,
    BigDecimal unitPrice,
    String taxTreatment
) {}
