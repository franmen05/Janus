package com.janus.customer.api.dto;

import com.janus.customer.domain.model.ContactType;
import com.janus.customer.domain.model.CustomerContact;
import java.time.LocalDateTime;

public record CustomerContactResponse(
        Long id,
        String firstName,
        String lastName,
        String identification,
        String phone,
        String email,
        ContactType contactType,
        boolean receiveNotifications,
        LocalDateTime createdAt
) {
    public static CustomerContactResponse from(CustomerContact c) {
        return new CustomerContactResponse(
                c.id,
                c.firstName,
                c.lastName,
                c.identification,
                c.phone,
                c.email,
                c.contactType,
                c.receiveNotifications,
                c.createdAt
        );
    }
}
