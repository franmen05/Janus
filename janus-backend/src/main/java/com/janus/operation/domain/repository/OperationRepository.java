package com.janus.operation.domain.repository;

import com.janus.operation.domain.model.Operation;
import com.janus.operation.domain.model.OperationStatus;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class OperationRepository implements PanacheRepository<Operation> {

    public List<Operation> findByStatus(OperationStatus status) {
        return list("status", status);
    }

    public List<Operation> findByAccountId(Long accountId) {
        return list("account.id", accountId);
    }

    public long countByStatus(OperationStatus status) {
        return count("status", status);
    }

    public long countByWarehouseId(Long warehouseId) {
        return count("warehouse.id", warehouseId);
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

    public List<Operation> findPaginated(OperationStatus status, Long accountId, String search, int page, int size) {
        var query = buildFilterQuery(status, accountId, search);
        var params = buildFilterParams(status, accountId, search);
        if (query.isEmpty()) {
            return findAll().page(Page.of(page, size)).list();
        }
        return find(String.join(" AND ", query), params.toArray())
                .page(Page.of(page, size))
                .list();
    }

    public long countFiltered(OperationStatus status, Long accountId, String search) {
        var query = buildFilterQuery(status, accountId, search);
        var params = buildFilterParams(status, accountId, search);
        if (query.isEmpty()) {
            return count();
        }
        return count(String.join(" AND ", query), params.toArray());
    }

    private List<String> buildFilterQuery(OperationStatus status, Long accountId, String search) {
        var clauses = new ArrayList<String>();
        int paramIndex = 1;
        if (status != null) {
            clauses.add("status = ?" + paramIndex++);
        }
        if (accountId != null) {
            clauses.add("account.id = ?" + paramIndex++);
        }
        if (search != null && !search.isBlank()) {
            clauses.add("(LOWER(referenceNumber) LIKE ?" + paramIndex + " OR LOWER(account.name) LIKE ?" + paramIndex + " OR LOWER(blNumber) LIKE ?" + paramIndex + ")");
            paramIndex++;
        }
        return clauses;
    }

    private List<Object> buildFilterParams(OperationStatus status, Long accountId, String search) {
        var params = new ArrayList<>();
        if (status != null) params.add(status);
        if (accountId != null) params.add(accountId);
        if (search != null && !search.isBlank()) params.add("%" + search.toLowerCase() + "%");
        return params;
    }
}
