package com.janus.operation.api.dto;

import jakarta.validation.constraints.NotNull;

public record BlOriginalAvailableRequest(
        @NotNull Boolean blOriginalAvailable
) {}
