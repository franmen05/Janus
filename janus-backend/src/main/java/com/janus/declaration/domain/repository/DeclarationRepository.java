package com.janus.declaration.domain.repository;

import com.janus.declaration.domain.model.Declaration;
import com.janus.declaration.domain.model.DeclarationType;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class DeclarationRepository implements PanacheRepository<Declaration> {

    public List<Declaration> findByOperationId(Long operationId) {
        return list("operation.id = ?1 ORDER BY createdAt DESC", operationId);
    }

    public Optional<Declaration> findByOperationAndType(Long operationId, DeclarationType type) {
        return find("operation.id = ?1 AND declarationType = ?2", operationId, type).firstResultOptional();
    }
}
