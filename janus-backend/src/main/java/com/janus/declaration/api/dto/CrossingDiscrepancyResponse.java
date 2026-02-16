package com.janus.declaration.api.dto;

import com.janus.declaration.domain.model.CrossingDiscrepancy;
import com.janus.declaration.domain.model.DiscrepancyField;
import java.math.BigDecimal;

public record CrossingDiscrepancyResponse(
        Long id,
        DiscrepancyField field,
        Integer tariffLineNumber,
        String preliminaryValue,
        String finalValue,
        BigDecimal difference,
        String description
) {
    public static CrossingDiscrepancyResponse from(CrossingDiscrepancy d) {
        return new CrossingDiscrepancyResponse(
                d.id, d.field, d.tariffLineNumber,
                d.preliminaryValue, d.finalValue, d.difference, d.description
        );
    }
}
