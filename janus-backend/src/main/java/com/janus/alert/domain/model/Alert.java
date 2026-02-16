package com.janus.alert.domain.model;

import com.janus.operation.domain.model.Operation;
import com.janus.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
public class Alert extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    public Operation operation;

    @Enumerated(EnumType.STRING)
    @Column(name = "alert_type", nullable = false)
    public AlertType alertType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public AlertStatus status = AlertStatus.ACTIVE;

    @Column(nullable = false, columnDefinition = "TEXT")
    public String message;

    @Column(name = "acknowledged_by")
    public String acknowledgedBy;

    @Column(name = "acknowledged_at")
    public LocalDateTime acknowledgedAt;
}
