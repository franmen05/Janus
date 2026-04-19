package com.janus.account.application;

import com.janus.account.api.dto.AccountResponse;
import com.janus.account.api.dto.CreateAccountRequest;
import com.janus.account.domain.model.Account;
import com.janus.account.domain.model.AccountType;
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
        accounts.forEach(a -> {
            a.contacts.size();
            a.associatedAccounts.size();
        });
        return accounts;
    }

    @Transactional
    public PageResponse<AccountResponse> listPaginated(String search, int page, int size) {
        var accounts = accountRepository.findPaginated(search, page, size);
        accounts.forEach(a -> {
            a.contacts.size();
            a.associatedAccounts.size();
        });
        var total = accountRepository.countFiltered(search);
        var content = accounts.stream().map(AccountResponse::from).toList();
        return PageResponse.of(content, page, size, total);
    }

    @Transactional
    public Account findById(Long id) {
        var account = accountRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Account", id));
        account.contacts.size();
        account.associatedAccounts.size();
        return account;
    }

    @Transactional
    public Account create(CreateAccountRequest request, String username) {
        checkNoDuplicates(request.name(), request.taxId(), request.accountCode(), -1L);

        var account = new Account();
        account.name = normalize(request.name());
        account.taxId = normalize(request.taxId());
        account.email = request.email();
        account.phone = request.phone();
        account.address = request.address();
        account.accountTypes = new HashSet<>(request.accountTypes());
        account.businessName = request.businessName();
        account.representative = request.representative();
        account.documentType = request.documentType();
        account.alternatePhone = request.alternatePhone();
        account.country = request.country();
        account.accountCode = normalize(request.accountCode());
        account.notes = request.notes();
        accountRepository.persist(account);
        auditEvent.fire(new AuditEvent(username, AuditAction.CREATE, "Account", account.id, null, null, null, "Account created: " + account.name));
        return account;
    }

    @Transactional
    public Account update(Long id, CreateAccountRequest request, String username) {
        checkNoDuplicates(request.name(), request.taxId(), request.accountCode(), id);

        var account = findById(id);
        account.name = normalize(request.name());
        account.taxId = normalize(request.taxId());
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
        account.accountCode = normalize(request.accountCode());
        account.notes = request.notes();
        auditEvent.fire(new AuditEvent(username, AuditAction.UPDATE, "Account", account.id, null, null, null, "Account updated: " + account.name));
        return account;
    }

    @Transactional
    public Account addPartner(Long socioId, Long associatedId, String username) {
        var socio = accountRepository.findByIdOptional(socioId)
                .orElseThrow(() -> new NotFoundException("Account", socioId));
        socio.contacts.size();
        socio.associatedAccounts.size();
        if (!socio.accountTypes.contains(AccountType.SOCIO)) {
            throw new BusinessException("ACCOUNT_NOT_SOCIO", "Account is not of type SOCIO");
        }
        if (socioId.equals(associatedId)) {
            throw new BusinessException("PARTNER_SELF_REFERENCE", "An account cannot be its own partner");
        }
        var associated = accountRepository.findByIdOptional(associatedId)
                .orElseThrow(() -> new NotFoundException("Account", associatedId));
        boolean alreadyLinked = socio.associatedAccounts.stream().anyMatch(a -> a.id.equals(associatedId));
        if (alreadyLinked) {
            throw new BusinessException("PARTNER_ALREADY_EXISTS", "This account is already a partner");
        }
        socio.associatedAccounts.add(associated);
        auditEvent.fire(new AuditEvent(username, AuditAction.UPDATE, "Account", socioId, null, null, null, "Partner added: " + associated.name));
        return socio;
    }

    @Transactional
    public Account removePartner(Long socioId, Long associatedId, String username) {
        var socio = accountRepository.findByIdOptional(socioId)
                .orElseThrow(() -> new NotFoundException("Account", socioId));
        socio.contacts.size();
        socio.associatedAccounts.size();
        socio.associatedAccounts.removeIf(a -> a.id.equals(associatedId));
        auditEvent.fire(new AuditEvent(username, AuditAction.UPDATE, "Account", socioId, null, null, null, "Partner removed: " + associatedId));
        return socio;
    }

    private void checkNoDuplicates(String name, String taxId, String accountCode, Long excludeId) {
        if (accountRepository.findByNameExcluding(name, excludeId).isPresent()) {
            throw new BusinessException("ACCOUNT_NAME_ALREADY_EXISTS",
                    "An account with this name already exists: " + name);
        }
        if (accountRepository.findByTaxIdExcluding(taxId, excludeId).isPresent()) {
            throw new BusinessException("ACCOUNT_TAX_ID_ALREADY_EXISTS",
                    "An account with this tax ID already exists: " + taxId);
        }
        if (accountCode != null && !accountCode.isBlank()
                && accountRepository.findByAccountCodeExcluding(accountCode, excludeId).isPresent()) {
            throw new BusinessException("ACCOUNT_CODE_ALREADY_EXISTS",
                    "An account with this code already exists: " + accountCode);
        }
    }

    private String normalize(String value) {
        if (value == null) return null;
        return value.trim().replaceAll("\\s+", " ");
    }
}
