package com.janus.inspection.api.dto;

import com.janus.inspection.domain.model.ServiceConfig;
import com.janus.inspection.domain.model.ServiceModule;
import java.time.LocalDateTime;
import java.util.Set;

public record ServiceResponse(
        Long id,
        String name,
        String labelEs,
        String labelEn,
        boolean active,
        int sortOrder,
        Set<ServiceModule> appliesTo,
        LocalDateTime createdAt
) {
    public static ServiceResponse from(ServiceConfig config) {
        return new ServiceResponse(
                config.id,
                config.name,
                config.labelEs,
                config.labelEn,
                config.active,
                config.sortOrder,
                config.appliesTo,
                config.createdAt
        );
    }
}
