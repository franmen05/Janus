package com.janus.operation.domain.model;

import com.janus.client.domain.model.Client;
import com.janus.shared.domain.BaseEntity;
import com.janus.user.domain.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "operations")
public class Operation extends BaseEntity {

    @Column(name = "reference_number", nullable = false, unique = true)
    public String referenceNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    public Client client;

    @Enumerated(EnumType.STRING)
    @Column(name = "cargo_type", nullable = false)
    public CargoType cargoType;

    @Enumerated(EnumType.STRING)
    @Column(name = "inspection_type", nullable = false)
    public InspectionType inspectionType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public OperationStatus status = OperationStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    public User assignedAgent;

    @Column(name = "origin_country", length = 2)
    public String originCountry;

    @Column(columnDefinition = "TEXT")
    public String notes;

    @Column(name = "closed_at")
    public LocalDateTime closedAt;

    public LocalDateTime deadline;
}
