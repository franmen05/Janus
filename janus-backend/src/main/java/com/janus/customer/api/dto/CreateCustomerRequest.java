package com.janus.customer.api.dto;

import com.janus.customer.domain.model.CustomerType;
import com.janus.customer.domain.model.DocumentType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCustomerRequest(
        @NotBlank String name,
        @NotBlank String taxId,
        @NotBlank @Email String email,
        String phone,
        String address,
        @NotNull CustomerType customerType,
        String businessName,
        String representative,
        DocumentType documentType,
        String alternatePhone,
        String country,
        String companyCode,
        String notes
) {}
