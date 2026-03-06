package com.janus.payment.domain.model;

import com.janus.declaration.domain.model.Declaration;
import com.janus.operation.domain.model.Operation;
import com.janus.shared.domain.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "liquidations")
public class Liquidation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    public Operation operation;

    @ManyToOne(fetch = FetchType.LAZY)
    public Declaration declaration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public LiquidationStatus status = LiquidationStatus.PRELIMINARY;

    @Column(name = "total_customs_taxes", precision = 15, scale = 2)
    public BigDecimal totalCustomsTaxes;

    @Column(name = "total_third_party", precision = 15, scale = 2)
    public BigDecimal totalThirdParty;

    @Column(name = "total_agency_services", precision = 15, scale = 2)
    public BigDecimal totalAgencyServices;

    @Column(name = "grand_total", precision = 15, scale = 2)
    public BigDecimal grandTotal;

    @Column(name = "dga_payment_code")
    public String dgaPaymentCode;

    @Column(name = "approved_by")
    public String approvedBy;

    @Column(name = "approved_at")
    public LocalDateTime approvedAt;

    @Column(name = "approval_comment", columnDefinition = "TEXT")
    public String approvalComment;

    @OneToMany(mappedBy = "liquidation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    public List<LiquidationLine> lines = new ArrayList<>();
}
