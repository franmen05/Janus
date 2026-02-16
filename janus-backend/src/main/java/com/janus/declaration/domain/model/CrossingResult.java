package com.janus.declaration.domain.model;

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
@Table(name = "crossing_results")
public class CrossingResult extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    public Operation operation;

    @ManyToOne(fetch = FetchType.LAZY)
    public Declaration preliminaryDeclaration;

    @ManyToOne(fetch = FetchType.LAZY)
    public Declaration finalDeclaration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public CrossingStatus status = CrossingStatus.PENDING;

    @Column(name = "resolved_by")
    public String resolvedBy;

    @Column(name = "resolution_comment", columnDefinition = "TEXT")
    public String resolutionComment;

    @Column(name = "resolved_at")
    public LocalDateTime resolvedAt;
}
