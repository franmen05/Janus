package com.janus.customer.api.dto;

import com.janus.customer.domain.model.Customer;
import com.janus.customer.domain.model.CustomerType;
import com.janus.customer.domain.model.DocumentType;
import java.time.LocalDateTime;
import java.util.List;

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
        String customerCode,
        String notes,
        LocalDateTime createdAt,
        List<CustomerContactResponse> contacts
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
                customer.customerCode,
                customer.notes,
                customer.createdAt,
                customer.contacts.stream().map(CustomerContactResponse::from).toList()
        );
    }
}
