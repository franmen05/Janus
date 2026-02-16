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
        return auditLogRepository.listAll();
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
}
