package com.janus.customer.domain.model;

import com.janus.shared.domain.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "customers")
public class Customer extends BaseEntity {

    @Column(nullable = false)
    public String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public CustomerType customerType;

    @Column(name = "tax_id", nullable = false, unique = true)
    public String taxId;

    @Column(nullable = false)
    public String email;

    public String phone;

    public String address;

    public String businessName;

    public String representative;

    @Enumerated(EnumType.STRING)
    public DocumentType documentType;

    public String alternatePhone;

    public String country;

    public String companyCode;

    public String notes;

    @Column(nullable = false)
    public boolean active = true;

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    public List<CustomerContact> contacts = new ArrayList<>();
}
