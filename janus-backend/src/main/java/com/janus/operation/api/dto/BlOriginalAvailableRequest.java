package com.janus.operation.api.dto;

import com.janus.operation.domain.model.BlAvailability;
import jakarta.validation.constraints.NotNull;

public record BlOriginalAvailableRequest(
        @NotNull BlAvailability blAvailability
) {}
