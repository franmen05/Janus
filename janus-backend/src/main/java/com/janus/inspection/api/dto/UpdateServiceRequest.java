package com.janus.inspection.api.dto;

import com.janus.inspection.domain.model.ServiceModule;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.Set;

public record UpdateServiceRequest(
        @NotBlank String labelEs,
        @NotBlank String labelEn,
        int sortOrder,
        Set<ServiceModule> appliesTo,
        BigDecimal defaultPrice,
        String defaultCurrency
) {}
