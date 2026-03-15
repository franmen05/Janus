package com.janus.inspection.api.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateExpenseCategoryRequest(
        @NotBlank String labelEs,
        @NotBlank String labelEn,
        int sortOrder
) {}
