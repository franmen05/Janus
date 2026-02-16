package com.janus.operation.api.dto;

import com.janus.operation.domain.model.CargoType;
import com.janus.operation.domain.model.InspectionType;
import jakarta.validation.constraints.NotNull;

public record CreateOperationRequest(
        @NotNull Long clientId,
        @NotNull CargoType cargoType,
        @NotNull InspectionType inspectionType,
        Long assignedAgentId,
        String notes
) {}
