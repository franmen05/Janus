package com.janus.account.api.dto;

import com.janus.account.domain.model.ContactType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateAccountContactRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank String identification,
        @NotBlank String phone,
        String email,
        @NotNull ContactType contactType,
        boolean receiveNotifications
) {}
