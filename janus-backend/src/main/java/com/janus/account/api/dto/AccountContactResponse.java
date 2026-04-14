package com.janus.account.api.dto;

import com.janus.account.domain.model.AccountContact;
import com.janus.account.domain.model.ContactType;
import java.time.LocalDateTime;

public record AccountContactResponse(
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
    public static AccountContactResponse from(AccountContact c) {
        return new AccountContactResponse(
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
