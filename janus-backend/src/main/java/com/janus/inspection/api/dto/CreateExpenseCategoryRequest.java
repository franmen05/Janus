package com.janus.inspection.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateExpenseCategoryRequest(
        @NotBlank String name,
        @NotBlank String labelEs,
        @NotBlank String labelEn
) {}
