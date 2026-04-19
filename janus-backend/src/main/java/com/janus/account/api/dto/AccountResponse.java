package com.janus.account.api.dto;

import com.janus.account.domain.model.Account;
import com.janus.account.domain.model.AccountType;
import com.janus.account.domain.model.DocumentType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public record AccountResponse(
        Long id,
        String name,
        String taxId,
        String email,
        String phone,
        String address,
        boolean active,
        Set<AccountType> accountTypes,
        String businessName,
        String representative,
        DocumentType documentType,
        String alternatePhone,
        String country,
        String accountCode,
        String notes,
        LocalDateTime createdAt,
        List<AccountContactResponse> contacts,
        List<AccountPartnerResponse> partnerAccounts
) {
    public static AccountResponse from(Account account) {
        return new AccountResponse(
                account.id,
                account.name,
                account.taxId,
                account.email,
                account.phone,
                account.address,
                account.active,
                account.accountTypes,
                account.businessName,
                account.representative,
                account.documentType,
                account.alternatePhone,
                account.country,
                account.accountCode,
                account.notes,
                account.createdAt,
                account.contacts.stream().map(AccountContactResponse::from).toList(),
                account.associatedAccounts.stream().map(AccountPartnerResponse::from).toList()
        );
    }
}
