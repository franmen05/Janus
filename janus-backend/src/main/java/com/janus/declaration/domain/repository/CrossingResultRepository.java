package com.janus.declaration.domain.repository;

import com.janus.declaration.domain.model.CrossingResult;
import com.janus.declaration.domain.model.CrossingStatus;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;

@ApplicationScoped
public class CrossingResultRepository implements PanacheRepository<CrossingResult> {

    public Optional<CrossingResult> findByOperationId(Long operationId) {
        return find("operation.id = ?1 ORDER BY createdAt DESC", operationId).firstResultOptional();
    }

    public boolean hasUnresolvedForOperation(Long operationId) {
        return count("operation.id = ?1 AND status = ?2", operationId, CrossingStatus.DISCREPANCY) > 0;
    }
}
