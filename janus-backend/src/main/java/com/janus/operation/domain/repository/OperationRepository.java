package com.janus.operation.domain.repository;

import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class OperationRepository implements PanacheRepository<Operation> {

    public List<Operation> findByStatus(OperationStatus status) {
        return list("status", status);
    }

    public List<Operation> findByClientId(Long clientId) {
        return list("client.id", clientId);
    }

    public long countByStatus(OperationStatus status) {
        return count("status", status);
    }

    public long getNextSequence() {
        var max = find("ORDER BY id DESC").firstResultOptional();
        return max.map(op -> ((Operation) op).id + 1).orElse(1L);
    }
}
