package com.janus.audit.domain.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog extends PanacheEntity {

    @Column(nullable = false)
    public String username;

    @Column(name = "ip_address")
    public String ipAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public AuditAction action;

    @Column(name = "entity_name", nullable = false)
    public String entityName;

    @Column(name = "entity_id")
    public Long entityId;

    @Column(columnDefinition = "TEXT")
    public String details;

    @Column(name = "previous_data", columnDefinition = "TEXT")
    public String previousData;

    @Column(name = "new_data", columnDefinition = "TEXT")
    public String newData;

    @Column(name = "operation_id")
    public Long operationId;

    @Column(name = "created_at", nullable = false, updatable = false)
    public LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
