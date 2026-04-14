package com.janus.account.application;

import com.janus.account.api.dto.AccountResponse;
import com.janus.account.api.dto.CreateAccountRequest;
import com.janus.account.domain.model.Account;
import com.janus.account.domain.repository.AccountRepository;
import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.shared.api.dto.PageResponse;
import com.janus.shared.infrastructure.exception.BusinessException;
import com.janus.shared.infrastructure.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.HashSet;
import java.util.List;

@ApplicationScoped
public class AccountService {

    @Inject
    AccountRepository accountRepository;

    @Inject
    Event<AuditEvent> auditEvent;

    @Transactional
    public List<Account> listAll() {
        var accounts = accountRepository.listAll();
        accounts.forEach(a -> a.contacts.size()); // force lazy init
        return accounts;
    }

    @Transactional
    public PageResponse<AccountResponse> listPaginated(String search, int page, int size) {
        var accounts = accountRepository.findPaginated(search, page, size);
        accounts.forEach(a -> a.contacts.size()); // force lazy init
        var total = accountRepository.countFiltered(search);
        var content = accounts.stream().map(AccountResponse::from).toList();
        return PageResponse.of(content, page, size, total);
    }

    @Transactional
    public Account findById(Long id) {
        var account = accountRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Account", id));
        account.contacts.size(); // force lazy init
        return account;
    }

    @Transactional
    public Account create(CreateAccountRequest request, String username) {
        if (accountRepository.findByTaxId(request.taxId()).isPresent()) {
            throw new BusinessException("Account with tax ID already exists: " + request.taxId());
        }

        var account = new Account();
        account.name = request.name();
        account.taxId = request.taxId();
        account.email = request.email();
        account.phone = request.phone();
        account.address = request.address();
        account.accountTypes = new HashSet<>(request.accountTypes());
        account.businessName = request.businessName();
        account.representative = request.representative();
        account.documentType = request.documentType();
        account.alternatePhone = request.alternatePhone();
        account.country = request.country();
        account.accountCode = request.accountCode();
        account.notes = request.notes();
        accountRepository.persist(account);
        auditEvent.fire(new AuditEvent(username, AuditAction.CREATE, "Account", account.id, null, null, null, "Account created: " + account.name));
        return account;
    }

    @Transactional
    public Account update(Long id, CreateAccountRequest request, String username) {
        var account = findById(id);
        account.name = request.name();
        account.taxId = request.taxId();
        account.email = request.email();
        account.phone = request.phone();
        account.address = request.address();
        account.accountTypes.clear();
        account.accountTypes.addAll(request.accountTypes());
        account.businessName = request.businessName();
        account.representative = request.representative();
        account.documentType = request.documentType();
        account.alternatePhone = request.alternatePhone();
        account.country = request.country();
        account.accountCode = request.accountCode();
        account.notes = request.notes();
        auditEvent.fire(new AuditEvent(username, AuditAction.UPDATE, "Account", account.id, null, null, null, "Account updated: " + account.name));
        return account;
    }
}
