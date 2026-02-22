package com.janus.inspection.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record ExpenseSummaryResponse(
        List<InspectionExpenseResponse> expenses,
        BigDecimal total
) {}
