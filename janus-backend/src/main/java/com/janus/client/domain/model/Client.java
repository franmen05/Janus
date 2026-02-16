package com.janus.client.domain.model;

import com.janus.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "clients")
public class Client extends BaseEntity {

    @Column(nullable = false)
    public String name;

    @Column(name = "tax_id", nullable = false, unique = true)
    public String taxId;

    @Column(nullable = false)
    public String email;

    public String phone;

    public String address;

    @Column(nullable = false)
    public boolean active = true;
}
