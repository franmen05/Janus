package com.janus.declaration.api.dto;

import jakarta.validation.constraints.NotBlank;

public record RegisterDuaRequest(
        @NotBlank String duaNumber
) {}
