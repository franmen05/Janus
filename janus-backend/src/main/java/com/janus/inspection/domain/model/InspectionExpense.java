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

    @Column(nullable = false)
    public String category;

    @Column(columnDefinition = "TEXT")
    public String description;

    @Column(precision = 15, scale = 2, nullable = false)
    public BigDecimal amount;

    @Column(nullable = false)
    public String currency = "USD";

    @Column(name = "expense_date")
    public LocalDate expenseDate;

    @Column(columnDefinition = "TEXT")
    public String justification;

    public String responsable;

    @Enumerated(EnumType.STRING)
    public PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(nullable = false)
    public boolean reimbursable = true;

    @Column(nullable = false)
    public boolean active = true;

    // ── New Charge Modal fields ──────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(name = "charge_type", columnDefinition = "VARCHAR(20) DEFAULT 'EXPENSE' NOT NULL")
    public ChargeType chargeType = ChargeType.EXPENSE;

    @Column(columnDefinition = "INT DEFAULT 1 NOT NULL")
    public int quantity = 1;

    @Column(length = 50)
    public String units;

    @Column(precision = 15, scale = 4)
    public BigDecimal rate;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type")
    public PaymentType paymentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "bill_to_type")
    public BillToType billToType;

    @Column(name = "bill_to_name", length = 255)
    public String billToName;

    @Column(name = "invoice_number", length = 100)
    public String invoiceNumber;

    @Column(name = "invoice_date")
    public LocalDate invoiceDate;

    @Column(name = "reference_number_charge", length = 100)
    public String referenceNumberCharge;

    @Column(name = "show_on_documents", columnDefinition = "BOOLEAN DEFAULT TRUE NOT NULL")
    public boolean showOnDocuments = true;

    @Column(name = "update_related", columnDefinition = "BOOLEAN DEFAULT FALSE NOT NULL")
    public boolean updateRelated = false;

    @Column(columnDefinition = "TEXT")
    public String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_status", columnDefinition = "VARCHAR(20) DEFAULT 'NONE' NOT NULL")
    public BillingStatus billingStatus = BillingStatus.NONE;

    @Column(name = "billflow_invoice_id")
    public Long billFlowInvoiceId;

    @Column(name = "ncf_number", length = 50)
    public String ncfNumber;
}
