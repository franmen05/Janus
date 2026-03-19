package com.janus.audit.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.audit.domain.model.AuditLog;
import com.janus.audit.domain.repository.AuditLogRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.event.TransactionPhase;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class AuditService {

    @Inject
    AuditLogRepository auditLogRepository;

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void onAuditEvent(@Observes(during = TransactionPhase.AFTER_SUCCESS) AuditEvent event) {
        var log = new AuditLog();
        log.username = event.username();
        log.action = event.action();
        log.entityName = event.entityName();
        log.entityId = event.entityId();
        log.operationId = event.operationId();
        log.previousData = event.previousData();
        log.newData = event.newData();
        log.details = event.details();
        auditLogRepository.persist(log);
    }

    @Transactional
    public void log(String username, String ipAddress, AuditAction action,
                    String entityName, Long entityId, String details) {
        var log = new AuditLog();
        log.username = username;
        log.ipAddress = ipAddress;
        log.action = action;
        log.entityName = entityName;
        log.entityId = entityId;
        log.details = details;
        auditLogRepository.persist(log);
    }

    public List<AuditLog> findAll() {
        return auditLogRepository.list("ORDER BY createdAt DESC");
    }

    public List<AuditLog> findByEntity(String entityName, Long entityId) {
        return auditLogRepository.findByEntityNameAndId(entityName, entityId);
    }

    public List<AuditLog> findByUsername(String username) {
        return auditLogRepository.findByUsername(username);
    }

    public List<AuditLog> findByOperationId(Long operationId) {
        return auditLogRepository.findByOperationId(operationId);
    }

    public List<AuditLog> findFiltered(String username, LocalDateTime from, LocalDateTime to) {
        boolean hasUsername = username != null && !username.isBlank();
        boolean hasDateRange = from != null && to != null;

        if (hasUsername && hasDateRange) {
            return auditLogRepository.list(
                    "username = ?1 AND createdAt >= ?2 AND createdAt <= ?3 ORDER BY createdAt DESC",
                    username, from, to);
        } else if (hasUsername) {
            return auditLogRepository.findByUsername(username);
        } else if (hasDateRange) {
            return auditLogRepository.findByDateRange(from, to);
        } else {
            return auditLogRepository.list("ORDER BY createdAt DESC");
        }
    }
}
