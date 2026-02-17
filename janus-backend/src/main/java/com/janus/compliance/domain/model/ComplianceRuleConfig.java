package com.janus.compliance.domain.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "compliance_rule_configs",
        uniqueConstraints = @UniqueConstraint(columnNames = {"rule_code", "param_key"}))
public class ComplianceRuleConfig extends PanacheEntity {

    @Column(name = "rule_code", nullable = false)
    public String ruleCode;

    @Column(name = "param_key", nullable = false)
    public String paramKey;

    @Column(name = "param_value", nullable = false, columnDefinition = "TEXT")
    public String paramValue;

    @Column(nullable = false)
    public boolean enabled = true;

    @Column(columnDefinition = "TEXT")
    public String description;
}
