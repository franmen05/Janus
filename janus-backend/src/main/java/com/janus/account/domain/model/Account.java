package com.janus.account.domain.model;

import com.janus.shared.domain.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "accounts")
public class Account extends BaseEntity {

    @Column(nullable = false, unique = true)
    public String name;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "account_types", joinColumns = @JoinColumn(name = "account_id"))
    @Column(name = "account_type")
    @Enumerated(EnumType.STRING)
    public Set<AccountType> accountTypes = new HashSet<>();

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

    @Column(unique = true)
    public String accountCode;

    public String notes;

    @Column(nullable = false)
    public boolean active = true;

    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    public List<AccountContact> contacts = new ArrayList<>();
}
