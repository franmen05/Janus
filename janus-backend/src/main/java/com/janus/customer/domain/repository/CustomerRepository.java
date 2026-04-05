package com.janus.customer.domain.repository;

import com.janus.customer.domain.model.Customer;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;

@ApplicationScoped
public class CustomerRepository implements PanacheRepository<Customer> {

    public Optional<Customer> findByTaxId(String taxId) {
        return find("taxId", taxId).firstResultOptional();
    }
}
