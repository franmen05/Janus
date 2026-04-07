package com.janus.customer.api.dto;

import com.janus.customer.domain.model.ContactType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCustomerContactRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank String identification,
        @NotBlank String phone,
        String email,
        @NotNull ContactType contactType,
        boolean receiveNotifications
) {}
