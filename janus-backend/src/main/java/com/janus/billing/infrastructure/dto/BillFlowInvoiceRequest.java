package com.janus.billing.infrastructure.dto;

import java.util.List;

public record BillFlowInvoiceRequest(
    String clientDocumentNumber,
    String ncfType,
    String dueDate,
    boolean autoIssue,
    List<BillFlowInvoiceLineRequest> lines
) {}
