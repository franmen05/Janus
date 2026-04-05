package com.janus.operation.api.dto;

import com.janus.operation.domain.model.BlAvailability;
import com.janus.operation.domain.model.BlType;
import com.janus.operation.domain.model.CargoType;
import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.OperationType;
import com.janus.operation.domain.model.TransportMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateOperationRequest(
        @NotNull Long customerId,
        @NotNull OperationType operationType,
        @NotNull TransportMode transportMode,
        CargoType cargoType,
        @NotNull OperationCategory operationCategory,
        Long assignedAgentId,
        @NotNull @NotBlank String blNumber,
        String containerNumber,
        @NotNull java.time.LocalDateTime estimatedArrival,
        @NotNull BlAvailability blAvailability,
        String notes,
        java.time.LocalDateTime arrivalDate,
        String incoterm,
        BlType blType,
        String childBlNumber,
        @NotNull Long arrivalPortId
) {}
