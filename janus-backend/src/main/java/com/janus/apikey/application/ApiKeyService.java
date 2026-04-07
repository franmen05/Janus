package com.janus.apikey.application;

import com.janus.apikey.domain.model.ApiKey;
import com.janus.apikey.domain.repository.ApiKeyRepository;
import com.janus.shared.infrastructure.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ApiKeyService {

    private static final String KEY_PREFIX = "jk_";
    private static final int KEY_LENGTH = 32;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Inject
    ApiKeyRepository apiKeyRepository;

    public List<ApiKey> listAll() {
        return apiKeyRepository.listAll();
    }

    @Transactional
    public ApiKeyCreationResult create(String name, LocalDateTime expiresAt, String createdBy) {
        String rawKey = generateRawKey();
        String fullKey = KEY_PREFIX + rawKey;
        String keyHash = hashKey(fullKey);

        var apiKey = new ApiKey();
        apiKey.name = name;
        apiKey.keyHash = keyHash;
        apiKey.keyPrefix = fullKey.substring(0, 11);
        apiKey.expiresAt = expiresAt;
        apiKey.createdBy = createdBy;
        apiKeyRepository.persist(apiKey);

        return new ApiKeyCreationResult(apiKey, fullKey);
    }

    @Transactional
    public void revoke(Long id) {
        var apiKey = apiKeyRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("ApiKey", id));
        apiKey.active = false;
    }

    @Transactional
    public Optional<ApiKey> validate(String rawKey) {
        String keyHash = hashKey(rawKey);
        var optKey = apiKeyRepository.findActiveByKeyHash(keyHash);
        if (optKey.isPresent()) {
            var apiKey = optKey.get();
            if (apiKey.isExpired()) {
                return Optional.empty();
            }
            apiKey.lastUsedAt = LocalDateTime.now();
            return Optional.of(apiKey);
        }
        return Optional.empty();
    }

    private String generateRawKey() {
        byte[] bytes = new byte[KEY_LENGTH];
        SECURE_RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    static String hashKey(String key) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(key.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    public record ApiKeyCreationResult(ApiKey apiKey, String plaintextKey) {}
}
