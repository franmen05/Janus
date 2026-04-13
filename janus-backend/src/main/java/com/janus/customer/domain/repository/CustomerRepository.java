package com.janus.customer.domain.repository;

import com.janus.customer.domain.model.Customer;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class CustomerRepository implements PanacheRepository<Customer> {

    public Optional<Customer> findByTaxId(String taxId) {
        return find("taxId", taxId).firstResultOptional();
    }

    public List<Customer> findPaginated(String search, int page, int size) {
        if (search != null && !search.isBlank()) {
            var pattern = "%" + search.toLowerCase() + "%";
            return find("LOWER(name) LIKE ?1 OR LOWER(taxId) LIKE ?1 OR LOWER(customerCode) LIKE ?1", pattern)
                    .page(Page.of(page, size))
                    .list();
        }
        return findAll().page(Page.of(page, size)).list();
    }

    public long countFiltered(String search) {
        if (search != null && !search.isBlank()) {
            var pattern = "%" + search.toLowerCase() + "%";
            return count("LOWER(name) LIKE ?1 OR LOWER(taxId) LIKE ?1 OR LOWER(customerCode) LIKE ?1", pattern);
        }
        return count();
    }
}
