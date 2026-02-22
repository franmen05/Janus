package com.janus.inspection.domain.model;

import com.janus.operation.domain.model.Operation;
import com.janus.shared.domain.BaseEntity;
import com.janus.user.domain.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "inspection_expenses")
public class InspectionExpense extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    public Operation operation;

    @ManyToOne(fetch = FetchType.LAZY)
    public User registeredBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public ExpenseCategory category;

    @Column(columnDefinition = "TEXT")
    public String description;

    @Column(precision = 15, scale = 2, nullable = false)
    public BigDecimal amount;

    @Column(nullable = false)
    public String currency = "USD";

    @Column(name = "expense_date", nullable = false)
    public LocalDate expenseDate;

    @Column(columnDefinition = "TEXT")
    public String justification;

    @Column(nullable = false)
    public boolean active = true;
}
