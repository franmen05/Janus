package com.janus.operation.api.dto;

import com.janus.operation.domain.model.BlType;
import com.janus.operation.domain.model.CargoType;
import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.TransportMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateOperationRequest(
        @NotNull Long clientId,
        @NotNull TransportMode transportMode,
        CargoType cargoType,
        @NotNull OperationCategory operationCategory,
        Long assignedAgentId,
        @NotNull @NotBlank String blNumber,
        String containerNumber,
        java.time.LocalDateTime estimatedArrival,
        @NotNull Boolean blOriginalAvailable,
        String notes,
        java.time.LocalDateTime deadline,
        String incoterm,
        BlType blType,
        String childBlNumber
) {}
