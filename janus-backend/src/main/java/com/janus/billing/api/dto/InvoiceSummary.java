package com.janus.billing.api.dto;

import java.math.BigDecimal;

public record InvoiceSummary(
    String invoiceCode, String ncfNumber,
    BigDecimal totalAmount, int lineCount
) {}
