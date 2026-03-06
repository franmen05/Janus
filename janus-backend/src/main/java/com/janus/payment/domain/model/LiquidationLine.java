package com.janus.payment.domain.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "liquidation_lines")
public class LiquidationLine extends PanacheEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    public Liquidation liquidation;

    @Column(nullable = false)
    public String concept;

    @Column(columnDefinition = "TEXT")
    public String description;

    @Column(name = "base_amount", precision = 15, scale = 2)
    public BigDecimal baseAmount;

    @Column(precision = 8, scale = 4)
    public BigDecimal rate;

    @Column(precision = 15, scale = 2, nullable = false)
    public BigDecimal amount;

    @Column(name = "line_order")
    public int lineOrder;

    @Column(nullable = false)
    public boolean reimbursable = false;
}
