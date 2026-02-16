package com.janus.audit.domain.repository;

import com.janus.audit.domain.model.AuditLog;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class AuditLogRepository implements PanacheRepository<AuditLog> {

    public List<AuditLog> findByEntityNameAndId(String entityName, Long entityId) {
        return list("entityName = ?1 AND entityId = ?2 ORDER BY createdAt DESC", entityName, entityId);
    }

    public List<AuditLog> findByUsername(String username) {
        return list("username = ?1 ORDER BY createdAt DESC", username);
    }
}
