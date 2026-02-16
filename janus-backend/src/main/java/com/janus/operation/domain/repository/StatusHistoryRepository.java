package com.janus.operation.domain.repository;

import com.janus.operation.domain.model.StatusHistory;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class StatusHistoryRepository implements PanacheRepository<StatusHistory> {

    public List<StatusHistory> findByOperationId(Long operationId) {
        return list("operation.id ORDER BY changedAt DESC", operationId);
    }

    @Transactional
    public long deleteByOperationId(Long operationId) {
        return delete("operation.id", operationId);
    }
}
