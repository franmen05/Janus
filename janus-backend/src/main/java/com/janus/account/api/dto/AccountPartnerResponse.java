package com.janus.account.api.dto;

import com.janus.account.domain.model.Account;

public record AccountPartnerResponse(Long id, String name, String accountCode) {
    public static AccountPartnerResponse from(Account account) {
        return new AccountPartnerResponse(account.id, account.name, account.accountCode);
    }
}
