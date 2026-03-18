package com.janus.alert.domain.repository;

import com.janus.alert.domain.model.Alert;
import com.janus.alert.domain.model.AlertStatus;
import com.janus.alert.domain.model.AlertType;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class AlertRepository implements PanacheRepository<Alert> {

    public List<Alert> findActive() {
        return list("status = ?1 ORDER BY createdAt DESC", AlertStatus.ACTIVE);
    }

    public List<Alert> findByOperationId(Long operationId) {
        return list("operation.id = ?1 ORDER BY createdAt DESC", operationId);
    }

    public long deleteByOperationId(Long operationId) {
        return delete("operation.id", operationId);
    }

    public boolean existsUnresolvedForOperation(Long operationId, AlertType alertType) {
        return count("operation.id = ?1 AND alertType = ?2 AND status IN (?3, ?4)",
                operationId, alertType, AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED) > 0;
    }
}
