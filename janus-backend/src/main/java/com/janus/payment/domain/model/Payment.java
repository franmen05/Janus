package com.janus.payment.domain.model;

import com.janus.operation.domain.model.Operation;
import com.janus.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "payments")
public class Payment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    public Operation operation;

    @OneToOne(fetch = FetchType.LAZY)
    public Liquidation liquidation;

    @Column(precision = 15, scale = 2, nullable = false)
    public BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    public PaymentMethod paymentMethod;

    @Column(name = "payment_date", nullable = false)
    public LocalDate paymentDate;

    @Column(name = "dga_reference")
    public String dgaReference;

    @Column(name = "bank_reference")
    public String bankReference;

    @Column(columnDefinition = "TEXT")
    public String notes;

    @Column(name = "registered_by")
    public String registeredBy;
}
