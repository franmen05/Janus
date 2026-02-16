package com.janus.user.domain.model;

import com.janus.shared.domain.BaseEntity;
import io.quarkus.security.jpa.Password;
import io.quarkus.security.jpa.Roles;
import io.quarkus.security.jpa.UserDefinition;
import io.quarkus.security.jpa.Username;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "users")
@UserDefinition
public class User extends BaseEntity {

    @Username
    @Column(nullable = false, unique = true)
    public String username;

    @Password
    @Column(nullable = false)
    public String password;

    @Column(name = "full_name", nullable = false)
    public String fullName;

    @Column(nullable = false)
    public String email;

    @Roles
    @Column(nullable = false)
    public String role;

    @Column(nullable = false)
    public boolean active = true;

    @Column(name = "client_id")
    public Long clientId;

    @Transient
    public Role getRoleEnum() {
        return Role.valueOf(role);
    }

    public void setRoleEnum(Role roleEnum) {
        this.role = roleEnum.name();
    }
}
