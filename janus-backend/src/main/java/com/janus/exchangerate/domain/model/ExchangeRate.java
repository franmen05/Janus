package com.janus.exchangerate.domain.model;

import com.janus.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "exchange_rate", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"source_currency", "target_currency", "effective_date"})
})
public class ExchangeRate extends BaseEntity {

    @Column(name = "source_currency", nullable = false)
    public String sourceCurrency = "USD";

    @Column(name = "target_currency", nullable = false)
    public String targetCurrency = "DOP";

    @Column(nullable = false, precision = 15, scale = 4)
    public BigDecimal rate;

    @Column(name = "effective_date", nullable = false)
    public LocalDate effectiveDate;

    @Column(nullable = false)
    public String source = "MANUAL";

    @Column(nullable = false)
    public boolean active = true;
}
