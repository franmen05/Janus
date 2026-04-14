package com.janus.account.api.dto;

import com.janus.account.domain.model.AccountType;
import com.janus.account.domain.model.DocumentType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record CreateAccountRequest(
        @NotBlank String name,
        @NotBlank String taxId,
        @NotBlank @Email String email,
        String phone,
        String address,
        @NotNull @Size(min = 1) Set<AccountType> accountTypes,
        String businessName,
        String representative,
        DocumentType documentType,
        String alternatePhone,
        String country,
        String accountCode,
        String notes
) {}
