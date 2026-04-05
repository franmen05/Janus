package com.janus.operation.domain.repository;

import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class OperationRepository implements PanacheRepository<Operation> {

    public List<Operation> findByStatus(OperationStatus status) {
        return list("status", status);
    }

    public List<Operation> findByCustomerId(Long customerId) {
        return list("customer.id", customerId);
    }

    public long countByStatus(OperationStatus status) {
        return count("status", status);
    }

    public long getNextSequence() {
        var max = find("ORDER BY id DESC").firstResultOptional();
        return max.map(op -> ((Operation) op).id + 1).orElse(1L);
    }

    public List<Operation> findInactiveSince(LocalDateTime threshold) {
        return list("status NOT IN (?1, ?2) AND updatedAt IS NOT NULL AND updatedAt < ?3",
                OperationStatus.CLOSED, OperationStatus.CANCELLED, threshold);
    }

    public List<Operation> findWithArrivalDateBetween(LocalDateTime from, LocalDateTime to) {
        return list("status NOT IN (?1, ?2) AND arrivalDate IS NOT NULL AND arrivalDate > ?3 AND arrivalDate < ?4",
                OperationStatus.CLOSED, OperationStatus.CANCELLED, from, to);
    }

    public List<Operation> findArrivedWithoutDeclaration(LocalDateTime now) {
        return list("estimatedArrival IS NOT NULL AND estimatedArrival <= ?1 AND status IN (?2, ?3, ?4, ?5, ?6, ?7)",
                now,
                OperationStatus.DRAFT,
                OperationStatus.DOCUMENTATION_COMPLETE,
                OperationStatus.IN_REVIEW,
                OperationStatus.PENDING_CORRECTION,
                OperationStatus.PRELIQUIDATION_REVIEW,
                OperationStatus.ANALYST_ASSIGNED);
    }
}
