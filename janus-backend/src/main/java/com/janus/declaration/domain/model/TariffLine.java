package com.janus.declaration.domain.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "tariff_lines")
public class TariffLine extends PanacheEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    public Declaration declaration;

    @Column(name = "line_number", nullable = false)
    public int lineNumber;

    @Column(name = "tariff_code", nullable = false)
    public String tariffCode;

    @Column(columnDefinition = "TEXT")
    public String description;

    @Column(precision = 15, scale = 4)
    public BigDecimal quantity;

    @Column(name = "unit_value", precision = 15, scale = 2)
    public BigDecimal unitValue;

    @Column(name = "total_value", precision = 15, scale = 2)
    public BigDecimal totalValue;

    @Column(name = "tax_rate", precision = 8, scale = 4)
    public BigDecimal taxRate;

    @Column(name = "tax_amount", precision = 15, scale = 2)
    public BigDecimal taxAmount;

    @Column(name = "duty_rate", precision = 8, scale = 4)
    public BigDecimal dutyRate;

    @Column(name = "duty_amount", precision = 15, scale = 2)
    public BigDecimal dutyAmount;

    @Column(name = "itbis_rate", precision = 8, scale = 4)
    public BigDecimal itbisRate;

    @Column(name = "itbis_amount", precision = 15, scale = 2)
    public BigDecimal itbisAmount;

    @Column(name = "selective_rate", precision = 8, scale = 4)
    public BigDecimal selectiveRate;

    @Column(name = "selective_amount", precision = 15, scale = 2)
    public BigDecimal selectiveAmount;

    @Column(name = "surcharge_rate", precision = 8, scale = 4)
    public BigDecimal surchargeRate;

    @Column(name = "surcharge_amount", precision = 15, scale = 2)
    public BigDecimal surchargeAmount;

    @Column(name = "admin_fee", precision = 15, scale = 2)
    public BigDecimal adminFee;
}
