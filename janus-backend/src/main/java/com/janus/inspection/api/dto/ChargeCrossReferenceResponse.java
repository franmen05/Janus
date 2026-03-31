package com.janus.inspection.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record ChargeCrossReferenceResponse(
    BigDecimal totalIncome,
    BigDecimal totalExpenses,
    BigDecimal balance,
    List<CategoryBreakdown> incomeByCategory,
    List<CategoryBreakdown> expenseByCategory,
    long reimbursableSentToBillingCount,
    long totalReimbursableCount,
    boolean allReimbursableSentToBilling
) {
    public record CategoryBreakdown(String category, BigDecimal amount, boolean reimbursable, List<String> descriptions) {}
}
