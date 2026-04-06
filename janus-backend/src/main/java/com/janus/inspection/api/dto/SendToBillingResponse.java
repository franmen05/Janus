package com.janus.inspection.api.dto;

import com.janus.billing.api.dto.InvoiceSummary;
import java.util.List;

public record SendToBillingResponse(int updatedCount, List<InvoiceSummary> invoices) {}
