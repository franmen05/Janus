package com.janus.port.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CreatePortRequest(
        @NotBlank String code,
        @NotBlank String name,
        String description
) {}
