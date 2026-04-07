package com.janus.apikey.api.dto;

import com.janus.apikey.domain.model.ApiKey;
import java.time.LocalDateTime;

public record ApiKeyCreatedResponse(
        Long id,
        String name,
        String keyPrefix,
        String key,
        LocalDateTime expiresAt,
        boolean active,
        LocalDateTime createdAt
) {
    public static ApiKeyCreatedResponse from(ApiKey apiKey, String plaintextKey) {
        return new ApiKeyCreatedResponse(
                apiKey.id,
                apiKey.name,
                apiKey.keyPrefix,
                plaintextKey,
                apiKey.expiresAt,
                apiKey.active,
                apiKey.createdAt
        );
    }
}
