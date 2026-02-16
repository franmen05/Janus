package com.janus.alert.application;

import com.janus.alert.domain.model.Alert;
import com.janus.alert.domain.model.AlertStatus;
import com.janus.alert.domain.model.AlertType;
import com.janus.alert.domain.repository.AlertRepository;
import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.operation.domain.model.Operation;
import com.janus.shared.infrastructure.exception.BusinessException;
import com.janus.shared.infrastructure.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class AlertService {

    @Inject
    AlertRepository alertRepository;

    @Inject
    Event<AuditEvent> auditEvent;

    public List<Alert> getActiveAlerts() {
        return alertRepository.findActive();
    }

    public List<Alert> getAlertsByOperationId(Long operationId) {
        return alertRepository.findByOperationId(operationId);
    }

    @Transactional
    public Alert acknowledge(Long alertId, String username) {
        var alert = alertRepository.findByIdOptional(alertId)
                .orElseThrow(() -> new NotFoundException("Alert", alertId));

        if (alert.status != AlertStatus.ACTIVE) {
            throw new BusinessException("Alert is not in ACTIVE status");
        }

        alert.status = AlertStatus.ACKNOWLEDGED;
        alert.acknowledgedBy = username;
        alert.acknowledgedAt = LocalDateTime.now();

        auditEvent.fire(new AuditEvent(
                username, AuditAction.UPDATE, "Alert", alertId,
                alert.operation != null ? alert.operation.id : null,
                null, null, "Alert acknowledged by " + username
        ));

        return alert;
    }

    @Transactional
    public Alert createAlert(Operation operation, AlertType alertType, String message) {
        if (alertRepository.existsActiveForOperation(operation.id, alertType)) {
            return null; // Don't create duplicate active alerts
        }

        var alert = new Alert();
        alert.operation = operation;
        alert.alertType = alertType;
        alert.message = message;
        alertRepository.persist(alert);

        auditEvent.fire(new AuditEvent(
                "system", AuditAction.ALERT_GENERATED, "Alert", alert.id, operation.id,
                null, null, "Alert generated: " + alertType + " for " + operation.referenceNumber
        ));

        return alert;
    }
}
