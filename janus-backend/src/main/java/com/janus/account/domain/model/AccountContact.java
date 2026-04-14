package com.janus.account.domain.model;

import com.janus.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "account_contacts")
public class AccountContact extends BaseEntity {

    @Column(nullable = false)
    public String firstName;

    @Column(nullable = false)
    public String lastName;

    @Column(nullable = false)
    public String identification;

    @Column(nullable = false)
    public String phone;

    public String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "contact_type", nullable = false)
    public ContactType contactType;

    @Column(name = "receive_notifications", nullable = false)
    public boolean receiveNotifications = false;

    @ManyToOne(fetch = FetchType.LAZY)
    public Account account;
}
