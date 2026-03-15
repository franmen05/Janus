package com.janus.inspection.api.dto;

import com.janus.inspection.domain.model.ExpenseCategoryConfig;
import java.time.LocalDateTime;

public record ExpenseCategoryResponse(
        Long id,
        String name,
        String labelEs,
        String labelEn,
        boolean active,
        int sortOrder,
        LocalDateTime createdAt
) {
    public static ExpenseCategoryResponse from(ExpenseCategoryConfig config) {
        return new ExpenseCategoryResponse(
                config.id,
                config.name,
                config.labelEs,
                config.labelEn,
                config.active,
                config.sortOrder,
                config.createdAt
        );
    }
}
