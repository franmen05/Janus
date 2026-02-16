package com.janus.notification.domain.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification extends PanacheEntity {

    @Column(name = "operation_id")
    public Long operationId;

    @Column(name = "recipient_email", nullable = false)
    public String recipientEmail;

    @Column(nullable = false)
    public String subject;

    @Column(columnDefinition = "TEXT", nullable = false)
    public String body;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public NotificationStatus status = NotificationStatus.PENDING;

    @Column(name = "sent_at")
    public LocalDateTime sentAt;

    @Column(name = "error_message")
    public String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    public LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
