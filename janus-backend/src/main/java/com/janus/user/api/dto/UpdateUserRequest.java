package com.janus.user.api.dto;

import com.janus.user.domain.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRequest(
        @NotBlank String fullName,
        @NotBlank @Email String email,
        @NotNull Role role,
        Long clientId,
        boolean active,
        String password
) {}
