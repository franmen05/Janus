package com.janus.account.application;

import com.janus.account.api.dto.CreateAccountContactRequest;
import com.janus.account.domain.model.AccountContact;
import com.janus.account.domain.model.ContactType;
import com.janus.account.domain.repository.AccountContactRepository;
import com.janus.account.domain.repository.AccountRepository;
import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.shared.infrastructure.exception.BusinessException;
import com.janus.shared.infrastructure.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class AccountContactService {

    @Inject
    AccountContactRepository accountContactRepository;

    @Inject
    AccountRepository accountRepository;

    @Inject
    Event<AuditEvent> auditEvent;

    public List<AccountContact> listByAccountId(Long accountId) {
        return accountContactRepository.findByAccountId(accountId);
    }

    @Transactional
    public AccountContact create(Long accountId, CreateAccountContactRequest request, String username) {
        var account = accountRepository.findByIdOptional(accountId)
                .orElseThrow(() -> new NotFoundException("Account", accountId));

        if (request.receiveNotifications() && (request.email() == null || request.email().isBlank())) {
            throw new BusinessException("EMAIL_REQUIRED_FOR_NOTIFICATIONS", "Email is required to receive notifications");
        }

        if (request.contactType() == ContactType.PRIMARY) {
            accountContactRepository.findPrimaryByAccountId(accountId).ifPresent(existing -> {
                throw new BusinessException("DUPLICATE_PRIMARY_CONTACT", "Account already has a primary contact");
            });
        }

        var contact = new AccountContact();
        contact.firstName = request.firstName();
        contact.lastName = request.lastName();
        contact.identification = request.identification();
        contact.phone = request.phone();
        contact.email = request.email();
        contact.contactType = request.contactType();
        contact.receiveNotifications = request.receiveNotifications();
        contact.account = account;
        accountContactRepository.persist(contact);

        auditEvent.fire(new AuditEvent(username, AuditAction.CREATE, "AccountContact", contact.id, null, null, null,
                "Contact created: " + contact.firstName + " " + contact.lastName));

        return contact;
    }

    @Transactional
    public AccountContact update(Long contactId, CreateAccountContactRequest request, String username) {
        var contact = accountContactRepository.findByIdOptional(contactId)
                .orElseThrow(() -> new NotFoundException("AccountContact", contactId));

        if (request.receiveNotifications() && (request.email() == null || request.email().isBlank())) {
            throw new BusinessException("EMAIL_REQUIRED_FOR_NOTIFICATIONS", "Email is required to receive notifications");
        }

        if (request.contactType() == ContactType.PRIMARY) {
            accountContactRepository.findPrimaryByAccountId(contact.account.id).ifPresent(existing -> {
                if (!existing.id.equals(contactId)) {
                    throw new BusinessException("DUPLICATE_PRIMARY_CONTACT", "Account already has a primary contact");
                }
            });
        }

        contact.firstName = request.firstName();
        contact.lastName = request.lastName();
        contact.identification = request.identification();
        contact.phone = request.phone();
        contact.email = request.email();
        contact.contactType = request.contactType();
        contact.receiveNotifications = request.receiveNotifications();

        auditEvent.fire(new AuditEvent(username, AuditAction.UPDATE, "AccountContact", contact.id, null, null, null,
                "Contact updated: " + contact.firstName + " " + contact.lastName));

        return contact;
    }

    @Transactional
    public void delete(Long contactId, String username) {
        var contact = accountContactRepository.findByIdOptional(contactId)
                .orElseThrow(() -> new NotFoundException("AccountContact", contactId));

        auditEvent.fire(new AuditEvent(username, AuditAction.DELETE, "AccountContact", contact.id, null, null, null,
                "Contact deleted: " + contact.firstName + " " + contact.lastName));

        accountContactRepository.delete(contact);
    }
}
