package com.janus.apikey.domain.repository;

import com.janus.apikey.domain.model.ApiKey;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;

@ApplicationScoped
public class ApiKeyRepository implements PanacheRepository<ApiKey> {

    public Optional<ApiKey> findByKeyHash(String keyHash) {
        return find("keyHash", keyHash).firstResultOptional();
    }

    public Optional<ApiKey> findActiveByKeyHash(String keyHash) {
        return find("keyHash = ?1 AND active = true", keyHash).firstResultOptional();
    }
}
