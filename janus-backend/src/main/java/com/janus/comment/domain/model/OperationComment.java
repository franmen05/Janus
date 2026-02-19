package com.janus.comment.domain.model;

import com.janus.operation.domain.model.Operation;
import com.janus.user.domain.model.User;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "operation_comments")
public class OperationComment extends PanacheEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    public Operation operation;

    @ManyToOne(fetch = FetchType.LAZY)
    public User author;

    @Column(nullable = false, columnDefinition = "TEXT")
    public String content;

    @Column(nullable = false)
    public boolean internal = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    public LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
