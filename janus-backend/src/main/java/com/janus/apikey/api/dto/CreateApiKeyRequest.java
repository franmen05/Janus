package com.janus.apikey.api.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public record CreateApiKeyRequest(
        @NotBlank String name,
        LocalDateTime expiresAt
) {}
