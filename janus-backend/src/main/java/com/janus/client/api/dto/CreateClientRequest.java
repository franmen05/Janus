package com.janus.client.api.dto;

import com.janus.client.domain.model.ClientType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateClientRequest(
        @NotBlank String name,
        @NotBlank String taxId,
        @NotBlank @Email String email,
        String phone,
        String address,
        @NotNull ClientType clientType
) {}
