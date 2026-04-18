package com.janus.operation.domain.model;

import com.janus.account.domain.model.Account;
import com.janus.warehouse.domain.model.Warehouse;
import com.janus.port.domain.model.Port;
import com.janus.shared.domain.BaseEntity;
import com.janus.user.domain.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "operations")
public class Operation extends BaseEntity {

    @Column(name = "reference_number", nullable = false, unique = true)
    public String referenceNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    public Account account;

    @Enumerated(EnumType.STRING)
    @Column(name = "operation_type", nullable = false)
    public OperationType operationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "transport_mode", nullable = false)
    public TransportMode transportMode;

    @Enumerated(EnumType.STRING)
    @Column(name = "cargo_type")
    public CargoType cargoType;

    @Enumerated(EnumType.STRING)
    @Column(name = "operation_category", nullable = false)
    public OperationCategory operationCategory;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public OperationStatus status = OperationStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    public User assignedAgent;

    @ManyToOne(fetch = FetchType.LAZY)
    public Port arrivalPort;

    @ManyToOne(fetch = FetchType.LAZY)
    public Port originPort;

    @ManyToOne(fetch = FetchType.LAZY)
    public Warehouse warehouse;

    @Column(name = "bl_number")
    public String blNumber;

    @Column(name = "container_number")
    public String containerNumber;

    @Column(name = "estimated_arrival")
    public LocalDateTime estimatedArrival;

    @Enumerated(EnumType.STRING)
    @Column(name = "bl_availability")
    public BlAvailability blAvailability = BlAvailability.NOT_AVAILABLE;

    @Column(columnDefinition = "TEXT")
    public String notes;

    @Column(name = "closed_at")
    public LocalDateTime closedAt;

    @Column(name = "arrival_date")
    public LocalDateTime arrivalDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "inspection_type")
    public InspectionType inspectionType;

    @Column(name = "inspection_set_at")
    public LocalDateTime inspectionSetAt;

    @Column(length = 10)
    public String incoterm;

    @Enumerated(EnumType.STRING)
    @Column(name = "bl_type")
    public BlType blType;

    @Column(name = "child_bl_number")
    public String childBlNumber;

    @Column(name = "local_charges_validated")
    public Boolean localChargesValidated = false;

    @Column(name = "valuation_finalized_at")
    public LocalDateTime valuationFinalizedAt;

    // ── Cargo dimension fields ───────────────────────────────────────────

    @Column
    public Integer pieces;

    @Column(name = "gross_weight", precision = 15, scale = 3)
    public BigDecimal grossWeight;

    @Column(name = "volumetric_weight", precision = 15, scale = 3)
    public BigDecimal volumetricWeight;

    @Column(precision = 15, scale = 3)
    public BigDecimal volume;

    @Column(name = "declared_value", precision = 15, scale = 2)
    public BigDecimal declaredValue;
}
