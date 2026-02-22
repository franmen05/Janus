package com.janus.operation.api.dto;

import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.TransportMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateOperationRequest(
        @NotNull Long clientId,
        @NotNull TransportMode transportMode,
        @NotNull OperationCategory operationCategory,
        Long assignedAgentId,
        @NotNull @NotBlank String blNumber,
        String containerNumber,
        java.time.LocalDateTime estimatedArrival,
        @NotNull Boolean blOriginalAvailable,
        String notes,
        java.time.LocalDateTime deadline,
        String incoterm
) {}
