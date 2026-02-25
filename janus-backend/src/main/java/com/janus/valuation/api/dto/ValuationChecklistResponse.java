package com.janus.valuation.api.dto;

import java.util.List;

public record ValuationChecklistResponse(
        List<ChecklistItem> items,
        boolean allPassed
) {
    public record ChecklistItem(
            String code,
            String label,
            boolean passed,
            String detail
    ) {}
}
