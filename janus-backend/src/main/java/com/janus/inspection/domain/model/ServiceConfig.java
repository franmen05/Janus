package com.janus.inspection.domain.model;

import com.janus.shared.domain.BaseEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.Set;

@Entity
@Table(name = "service_configs")
public class ServiceConfig extends BaseEntity {

    @Column(nullable = false, unique = true)
    public String name;

    @Column(name = "label_es", nullable = false)
    public String labelEs;

    @Column(name = "label_en", nullable = false)
    public String labelEn;

    @Column(nullable = false)
    public boolean active = true;

    @Column(name = "sort_order", nullable = false)
    public int sortOrder = 0;

    @Column(name = "default_price", precision = 12, scale = 2)
    public BigDecimal defaultPrice;

    @Column(name = "default_currency", length = 3)
    public String defaultCurrency;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "service_config_modules", joinColumns = @JoinColumn(name = "service_config_id"))
    @Column(name = "module")
    @Enumerated(EnumType.STRING)
    public Set<ServiceModule> appliesTo = EnumSet.allOf(ServiceModule.class);
}
