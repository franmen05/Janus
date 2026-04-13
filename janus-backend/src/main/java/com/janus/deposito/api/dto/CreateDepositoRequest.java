package com.janus.deposito.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateDepositoRequest(
        @NotBlank String code,
        @NotBlank String name,
        String description
) {}
