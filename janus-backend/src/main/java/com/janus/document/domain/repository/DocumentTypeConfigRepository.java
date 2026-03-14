package com.janus.document.domain.repository;

import com.janus.document.domain.model.DocumentTypeConfig;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;

@ApplicationScoped
public class DocumentTypeConfigRepository implements PanacheRepository<DocumentTypeConfig> {

    public Optional<DocumentTypeConfig> findByCode(String code) {
        return find("code", code).firstResultOptional();
    }
}
