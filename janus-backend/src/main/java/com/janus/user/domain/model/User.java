package com.janus.user.domain.model;

import com.janus.shared.domain.BaseEntity;
import io.quarkus.security.jpa.Password;
import io.quarkus.security.jpa.Roles;
import io.quarkus.security.jpa.UserDefinition;
import io.quarkus.security.jpa.Username;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

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
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role")
    public Set<String> roles = new HashSet<>();

    @Column(nullable = false)
    public boolean active = true;

    @Column(name = "customer_id")
    public Long customerId;

    @Transient
    public Set<Role> getRoleEnums() {
        var result = new HashSet<Role>();
        for (var r : roles) {
            result.add(Role.valueOf(r));
        }
        return result;
    }

    public void setRoleEnums(Set<Role> roleEnums) {
        this.roles = new HashSet<>();
        for (var r : roleEnums) {
            this.roles.add(r.name());
        }
    }

    public boolean hasRole(String roleName) {
        return roles.contains(roleName);
    }
}
