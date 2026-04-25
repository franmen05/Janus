package com.janus.account.application;

import com.janus.account.api.dto.AccountCodeConfigDto;
import com.janus.account.domain.model.AccountCodeConfig;
import com.janus.account.domain.repository.AccountCodeConfigRepository;
import com.janus.account.domain.repository.AccountRepository;
import com.janus.shared.infrastructure.exception.BusinessException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class AccountCodeConfigService {

    @Inject
    AccountCodeConfigRepository configRepository;

    @Inject
    AccountRepository accountRepository;

    @Transactional
    public AccountCodeConfigDto get() {
        return toDto(configRepository.getSingleton());
    }

    @Transactional
    public AccountCodeConfigDto update(AccountCodeConfigDto request) {
        if (request.prefix() == null || request.prefix().isBlank()) {
            throw new BusinessException("ACCOUNT_CODE_CONFIG_INVALID_PREFIX",
                    "Prefix must not be blank");
        }
        if (request.paddingLength() < 1 || request.paddingLength() > 10) {
            throw new BusinessException("ACCOUNT_CODE_CONFIG_INVALID_PADDING",
                    "Padding length must be between 1 and 10");
        }
        if (request.separator() == null) {
            throw new BusinessException("ACCOUNT_CODE_CONFIG_INVALID_SEPARATOR",
                    "Separator must not be null");
        }
        if (request.separator().length() > 5) {
            throw new BusinessException("ACCOUNT_CODE_CONFIG_INVALID_SEPARATOR",
                    "Separator must be at most 5 characters");
        }
        var config = configRepository.getSingleton();
        config.prefix = request.prefix().trim();
        config.separator = request.separator();
        config.paddingLength = request.paddingLength();
        config.enabled = request.enabled();
        return toDto(config);
    }

    /**
     * Reads the current configuration. Caller is responsible for being inside a transaction.
     */
    public AccountCodeConfig getConfig() {
        return configRepository.getSingleton();
    }

    /**
     * Generates the next account code based on current configuration.
     * Caller must be inside a transaction.
     */
    public String generateNext() {
        var config = configRepository.getSingleton();
        long max = accountRepository.findMaxSequenceForPrefix(config.prefix, config.separator);
        return formatCode(config, max + 1);
    }

    /**
     * Formats a code given a config and a sequence number.
     */
    public String formatCode(AccountCodeConfig config, long sequence) {
        String padded = String.format("%0" + config.paddingLength + "d", sequence);
        return config.prefix + config.separator + padded;
    }

    private AccountCodeConfigDto toDto(AccountCodeConfig c) {
        return new AccountCodeConfigDto(c.prefix, c.separator, c.paddingLength, c.enabled);
    }
}
