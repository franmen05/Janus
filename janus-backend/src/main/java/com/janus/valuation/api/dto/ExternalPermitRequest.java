package com.janus.valuation.api.dto;

import com.janus.valuation.domain.model.ExternalPermitStatus;
import com.janus.valuation.domain.model.ExternalPermitType;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ExternalPermitRequest(
        @NotNull ExternalPermitType permitType,
        ExternalPermitStatus status,
        String referenceNumber,
        LocalDate issuedDate,
        LocalDate expiryDate,
        String notes
) {}
