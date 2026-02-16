package com.janus.audit.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditLog;
import com.janus.audit.domain.repository.AuditLogRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class AuditService {

    @Inject
    AuditLogRepository auditLogRepository;

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
}
