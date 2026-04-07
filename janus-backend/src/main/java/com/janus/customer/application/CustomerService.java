package com.janus.customer.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.customer.api.dto.CreateCustomerRequest;
import com.janus.customer.domain.model.Customer;
import com.janus.customer.domain.repository.CustomerRepository;
import com.janus.shared.infrastructure.exception.BusinessException;
import com.janus.shared.infrastructure.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class CustomerService {

    @Inject
    CustomerRepository customerRepository;

    @Inject
    Event<AuditEvent> auditEvent;

    @Transactional
    public List<Customer> listAll() {
        var customers = customerRepository.listAll();
        customers.forEach(c -> c.contacts.size()); // force lazy init
        return customers;
    }

    @Transactional
    public Customer findById(Long id) {
        var customer = customerRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Customer", id));
        customer.contacts.size(); // force lazy init
        return customer;
    }

    @Transactional
    public Customer create(CreateCustomerRequest request, String username) {
        if (customerRepository.findByTaxId(request.taxId()).isPresent()) {
            throw new BusinessException("Customer with tax ID already exists: " + request.taxId());
        }

        var customer = new Customer();
        customer.name = request.name();
        customer.taxId = request.taxId();
        customer.email = request.email();
        customer.phone = request.phone();
        customer.address = request.address();
        customer.customerType = request.customerType();
        customer.businessName = request.businessName();
        customer.representative = request.representative();
        customer.documentType = request.documentType();
        customer.alternatePhone = request.alternatePhone();
        customer.country = request.country();
        customer.customerCode = request.customerCode();
        customer.notes = request.notes();
        customerRepository.persist(customer);
        auditEvent.fire(new AuditEvent(username, AuditAction.CREATE, "Customer", customer.id, null, null, null, "Customer created: " + customer.name));
        return customer;
    }

    @Transactional
    public Customer update(Long id, CreateCustomerRequest request, String username) {
        var customer = findById(id);
        customer.name = request.name();
        customer.taxId = request.taxId();
        customer.email = request.email();
        customer.phone = request.phone();
        customer.address = request.address();
        customer.customerType = request.customerType();
        customer.businessName = request.businessName();
        customer.representative = request.representative();
        customer.documentType = request.documentType();
        customer.alternatePhone = request.alternatePhone();
        customer.country = request.country();
        customer.customerCode = request.customerCode();
        customer.notes = request.notes();
        auditEvent.fire(new AuditEvent(username, AuditAction.UPDATE, "Customer", customer.id, null, null, null, "Customer updated: " + customer.name));
        return customer;
    }
}
