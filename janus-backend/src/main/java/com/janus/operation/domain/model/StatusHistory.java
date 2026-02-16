package com.janus.operation.domain.model;

import com.janus.user.domain.model.User;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "status_history")
public class StatusHistory extends PanacheEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    public Operation operation;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status")
    public OperationStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false)
    public OperationStatus newStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    public User changedBy;

    @Column(columnDefinition = "TEXT")
    public String comment;

    @Column(name = "changed_at", nullable = false, updatable = false)
    public LocalDateTime changedAt;

    @Column(name = "ip_address")
    public String ipAddress;

    @PrePersist
    public void prePersist() {
        changedAt = LocalDateTime.now();
    }
}
