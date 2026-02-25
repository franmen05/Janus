package com.janus.valuation.domain.model;

import com.janus.operation.domain.model.Operation;
import com.janus.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "external_permits")
public class ExternalPermit extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    public Operation operation;

    @Enumerated(EnumType.STRING)
    @Column(name = "permit_type", nullable = false)
    public ExternalPermitType permitType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public ExternalPermitStatus status = ExternalPermitStatus.PENDIENTE;

    @Column(name = "reference_number")
    public String referenceNumber;

    @Column(name = "issued_date")
    public LocalDate issuedDate;

    @Column(name = "expiry_date")
    public LocalDate expiryDate;

    @Column(columnDefinition = "TEXT")
    public String notes;

    @Column(name = "updated_by")
    public String updatedBy;
}
