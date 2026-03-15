package com.janus.inspection.domain.model;

import com.janus.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "expense_category_configs")
public class ExpenseCategoryConfig extends BaseEntity {

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
}
