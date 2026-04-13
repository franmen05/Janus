package com.janus.customer.api.dto;

import com.janus.customer.domain.model.CustomerType;
import com.janus.customer.domain.model.DocumentType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record CreateCustomerRequest(
        @NotBlank String name,
        @NotBlank String taxId,
        @NotBlank @Email String email,
        String phone,
        String address,
        @NotNull @Size(min = 1) Set<CustomerType> customerTypes,
        String businessName,
        String representative,
        DocumentType documentType,
        String alternatePhone,
        String country,
        String customerCode,
        String notes
) {}
