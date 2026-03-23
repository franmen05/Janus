package com.janus.port.domain.model;

import com.janus.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "ports")
public class Port extends BaseEntity {

    @Column(nullable = false, unique = true)
    public String code;

    @Column(nullable = false)
    public String name;

    @Column(columnDefinition = "TEXT")
    public String description;

    @Column(columnDefinition = "TEXT")
    public String address;

    @Column(length = 2)
    public String country;
}
