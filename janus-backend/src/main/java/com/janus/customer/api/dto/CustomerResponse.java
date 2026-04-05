package com.janus.customer.api.dto;

import com.janus.customer.domain.model.Customer;
import com.janus.customer.domain.model.CustomerType;
import com.janus.customer.domain.model.DocumentType;
import java.time.LocalDateTime;

public record CustomerResponse(
        Long id,
        String name,
        String taxId,
        String email,
        String phone,
        String address,
        boolean active,
        CustomerType customerType,
        String businessName,
        String representative,
        DocumentType documentType,
        String alternatePhone,
        String country,
        LocalDateTime createdAt
) {
    public static CustomerResponse from(Customer customer) {
        return new CustomerResponse(
                customer.id,
                customer.name,
                customer.taxId,
                customer.email,
                customer.phone,
                customer.address,
                customer.active,
                customer.customerType,
                customer.businessName,
                customer.representative,
                customer.documentType,
                customer.alternatePhone,
                customer.country,
                customer.createdAt
        );
    }
}
