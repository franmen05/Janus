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

    public boolean existsActiveForOperation(Long operationId, AlertType alertType) {
        return count("operation.id = ?1 AND alertType = ?2 AND status = ?3",
                operationId, alertType, AlertStatus.ACTIVE) > 0;
    }
}
