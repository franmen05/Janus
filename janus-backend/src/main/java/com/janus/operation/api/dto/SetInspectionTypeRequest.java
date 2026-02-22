package com.janus.operation.api.dto;

import com.janus.operation.domain.model.InspectionType;
import jakarta.validation.constraints.NotNull;

public record SetInspectionTypeRequest(
        @NotNull InspectionType inspectionType,
        String comment
) {}
