package com.janus.customer.domain.model;

import com.janus.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

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

    @Column(nullable = false)
    public boolean active = true;
}
