package com.janus.customer.domain.repository;

import com.janus.customer.domain.model.ContactType;
import com.janus.customer.domain.model.CustomerContact;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class CustomerContactRepository implements PanacheRepository<CustomerContact> {

    public List<CustomerContact> findByCustomerId(Long customerId) {
        return find("customer.id", customerId).list();
    }

    public Optional<CustomerContact> findPrimaryByCustomerId(Long customerId) {
        return find("customer.id = ?1 and contactType = ?2", customerId, ContactType.PRIMARY).firstResultOptional();
    }
}
