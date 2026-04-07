package com.janus.apikey.domain.model;

import com.janus.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "api_keys")
public class ApiKey extends BaseEntity {

    @Column(nullable = false)
    public String name;

    @Column(name = "key_hash", nullable = false, unique = true, length = 64)
    public String keyHash;

    @Column(name = "key_prefix", nullable = false, length = 12)
    public String keyPrefix;

    @Column(name = "expires_at")
    public LocalDateTime expiresAt;

    @Column(nullable = false)
    public boolean active = true;

    @Column(name = "created_by", nullable = false)
    public String createdBy;

    @Column(name = "last_used_at")
    public LocalDateTime lastUsedAt;

    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }

    public boolean isValid() {
        return active && !isExpired();
    }
}
