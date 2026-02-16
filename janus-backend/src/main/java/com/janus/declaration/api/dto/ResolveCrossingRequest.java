package com.janus.declaration.api.dto;

import jakarta.validation.constraints.NotBlank;

public record ResolveCrossingRequest(
        @NotBlank String comment
) {}
