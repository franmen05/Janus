package com.janus.operation.api.dto;

import com.janus.operation.domain.model.OperationStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeStatusRequest(
        @NotNull OperationStatus newStatus,
        String comment
) {}
