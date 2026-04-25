package com.janus.account.api.dto;

public record AccountCodeConfigDto(
        String prefix,
        String separator,
        int paddingLength,
        boolean enabled
) {}
