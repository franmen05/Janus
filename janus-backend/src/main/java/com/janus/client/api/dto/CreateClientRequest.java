package com.janus.client.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateClientRequest(
        @NotBlank String name,
        @NotBlank String taxId,
        @NotBlank @Email String email,
        String phone,
        String address
) {}
