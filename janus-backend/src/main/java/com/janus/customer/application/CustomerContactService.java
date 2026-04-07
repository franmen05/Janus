package com.janus.customer.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.customer.api.dto.CreateCustomerContactRequest;
import com.janus.customer.domain.model.ContactType;
import com.janus.customer.domain.model.CustomerContact;
import com.janus.customer.domain.repository.CustomerContactRepository;
import com.janus.customer.domain.repository.CustomerRepository;
import com.janus.shared.infrastructure.exception.BusinessException;
import com.janus.shared.infrastructure.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class CustomerContactService {

    @Inject
    CustomerContactRepository customerContactRepository;

    @Inject
    CustomerRepository customerRepository;

    @Inject
    Event<AuditEvent> auditEvent;

    public List<CustomerContact> listByCustomerId(Long customerId) {
        return customerContactRepository.findByCustomerId(customerId);
    }

    @Transactional
    public CustomerContact create(Long customerId, CreateCustomerContactRequest request, String username) {
        var customer = customerRepository.findByIdOptional(customerId)
                .orElseThrow(() -> new NotFoundException("Customer", customerId));

        if (request.receiveNotifications() && (request.email() == null || request.email().isBlank())) {
            throw new BusinessException("EMAIL_REQUIRED_FOR_NOTIFICATIONS", "Email is required to receive notifications");
        }

        if (request.contactType() == ContactType.PRIMARY) {
            customerContactRepository.findPrimaryByCustomerId(customerId).ifPresent(existing -> {
                throw new BusinessException("DUPLICATE_PRIMARY_CONTACT", "Customer already has a primary contact");
            });
        }

        var contact = new CustomerContact();
        contact.firstName = request.firstName();
        contact.lastName = request.lastName();
        contact.identification = request.identification();
        contact.phone = request.phone();
        contact.email = request.email();
        contact.contactType = request.contactType();
        contact.receiveNotifications = request.receiveNotifications();
        contact.customer = customer;
        customerContactRepository.persist(contact);

        auditEvent.fire(new AuditEvent(username, AuditAction.CREATE, "CustomerContact", contact.id, null, null, null,
                "Contact created: " + contact.firstName + " " + contact.lastName));

        return contact;
    }

    @Transactional
    public CustomerContact update(Long contactId, CreateCustomerContactRequest request, String username) {
        var contact = customerContactRepository.findByIdOptional(contactId)
                .orElseThrow(() -> new NotFoundException("CustomerContact", contactId));

        if (request.receiveNotifications() && (request.email() == null || request.email().isBlank())) {
            throw new BusinessException("EMAIL_REQUIRED_FOR_NOTIFICATIONS", "Email is required to receive notifications");
        }

        if (request.contactType() == ContactType.PRIMARY) {
            customerContactRepository.findPrimaryByCustomerId(contact.customer.id).ifPresent(existing -> {
                if (!existing.id.equals(contactId)) {
                    throw new BusinessException("DUPLICATE_PRIMARY_CONTACT", "Customer already has a primary contact");
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

        auditEvent.fire(new AuditEvent(username, AuditAction.UPDATE, "CustomerContact", contact.id, null, null, null,
                "Contact updated: " + contact.firstName + " " + contact.lastName));

        return contact;
    }

    @Transactional
    public void delete(Long contactId, String username) {
        var contact = customerContactRepository.findByIdOptional(contactId)
                .orElseThrow(() -> new NotFoundException("CustomerContact", contactId));

        auditEvent.fire(new AuditEvent(username, AuditAction.DELETE, "CustomerContact", contact.id, null, null, null,
                "Contact deleted: " + contact.firstName + " " + contact.lastName));

        customerContactRepository.delete(contact);
    }
}
