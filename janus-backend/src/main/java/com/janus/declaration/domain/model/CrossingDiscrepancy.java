package com.janus.declaration.domain.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "crossing_discrepancies")
public class CrossingDiscrepancy extends PanacheEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    public CrossingResult crossingResult;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public DiscrepancyField field;

    @Column(name = "tariff_line_number")
    public Integer tariffLineNumber;

    @Column(name = "preliminary_value")
    public String preliminaryValue;

    @Column(name = "final_value")
    public String finalValue;

    @Column(precision = 15, scale = 2)
    public BigDecimal difference;

    @Column(columnDefinition = "TEXT")
    public String description;
}
