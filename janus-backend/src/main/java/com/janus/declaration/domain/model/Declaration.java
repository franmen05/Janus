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
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "declarations")
public class Declaration extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    public Operation operation;

    @Enumerated(EnumType.STRING)
    @Column(name = "declaration_type", nullable = false)
    public DeclarationType declarationType;

    @Column(name = "declaration_number")
    public String declarationNumber;

    @Column(name = "fob_value", precision = 15, scale = 2)
    public BigDecimal fobValue;

    @Column(name = "cif_value", precision = 15, scale = 2)
    public BigDecimal cifValue;

    @Column(name = "taxable_base", precision = 15, scale = 2)
    public BigDecimal taxableBase;

    @Column(name = "total_taxes", precision = 15, scale = 2)
    public BigDecimal totalTaxes;

    @Column(name = "freight_value", precision = 15, scale = 2)
    public BigDecimal freightValue;

    @Column(name = "insurance_value", precision = 15, scale = 2)
    public BigDecimal insuranceValue;

    @Column(name = "gatt_method")
    public String gattMethod;

    @Column(name = "gatt_commercial_links")
    public Boolean gattCommercialLinks;

    @Column(name = "gatt_commissions", precision = 15, scale = 2)
    public BigDecimal gattCommissions;

    @Column(name = "gatt_unrecorded_transport", precision = 15, scale = 2)
    public BigDecimal gattUnrecordedTransport;

    @Column(name = "gatt_adjustment_amount", precision = 15, scale = 2)
    public BigDecimal gattAdjustmentAmount;

    @Column(name = "gatt_justification", columnDefinition = "TEXT")
    public String gattJustification;

    @Column(name = "gatt_completed_at")
    public LocalDateTime gattCompletedAt;

    @Column(name = "gatt_completed_by")
    public String gattCompletedBy;

    @Column(columnDefinition = "TEXT")
    public String notes;

    @Column(name = "submitted_at")
    public LocalDateTime submittedAt;

    // --- Approval fields ---

    @Column(name = "technical_approved_by")
    public String technicalApprovedBy;

    @Column(name = "technical_approved_at")
    public LocalDateTime technicalApprovedAt;

    @Column(name = "technical_approval_comment", columnDefinition = "TEXT")
    public String technicalApprovalComment;

    @Column(name = "final_approved_by")
    public String finalApprovedBy;

    @Column(name = "final_approved_at")
    public LocalDateTime finalApprovedAt;

    @Column(name = "final_approval_comment", columnDefinition = "TEXT")
    public String finalApprovalComment;

    @Column(name = "rejected_by")
    public String rejectedBy;

    @Column(name = "rejected_at")
    public LocalDateTime rejectedAt;

    @Column(name = "rejection_comment", columnDefinition = "TEXT")
    public String rejectionComment;
}
