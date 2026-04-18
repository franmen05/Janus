package com.janus.billing.infrastructure.dto;

import java.math.BigDecimal;

public record BillFlowInvoiceResponse(
    Long id,
    String invoiceCode,
    String ncfNumber,
    String status,
    Long clientId,
    String clientName,
    BigDecimal totalAmount
) {}
