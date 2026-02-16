package com.janus.compliance.domain.model;

import java.util.List;

public record ValidationResult(
        boolean passed,
        List<ValidationError> errors
) {
    public record ValidationError(
            String ruleCode,
            String message
    ) {}

    public static ValidationResult success() {
        return new ValidationResult(true, List.of());
    }

    public static ValidationResult failure(List<ValidationError> errors) {
        return new ValidationResult(false, errors);
    }
}
