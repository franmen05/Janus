package com.janus.apikey.api.dto;

import com.janus.apikey.domain.model.ApiKey;
import java.time.LocalDateTime;

public record ApiKeyResponse(
        Long id,
        String name,
        String keyPrefix,
        LocalDateTime expiresAt,
        boolean active,
        String createdBy,
        LocalDateTime lastUsedAt,
        LocalDateTime createdAt
) {
    public static ApiKeyResponse from(ApiKey apiKey) {
        return new ApiKeyResponse(
                apiKey.id,
                apiKey.name,
                apiKey.keyPrefix,
                apiKey.expiresAt,
                apiKey.active,
                apiKey.createdBy,
                apiKey.lastUsedAt,
                apiKey.createdAt
        );
    }
}
