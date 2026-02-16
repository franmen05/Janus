package com.janus.client.domain.repository;

import com.janus.client.domain.model.Client;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;

@ApplicationScoped
public class ClientRepository implements PanacheRepository<Client> {

    public Optional<Client> findByTaxId(String taxId) {
        return find("taxId", taxId).firstResultOptional();
    }
}
