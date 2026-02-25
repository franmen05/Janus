package com.janus.valuation.api.dto;

import com.janus.valuation.domain.model.ExternalPermit;
import com.janus.valuation.domain.model.ExternalPermitStatus;
import com.janus.valuation.domain.model.ExternalPermitType;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ExternalPermitResponse(
        Long id,
        Long operationId,
        ExternalPermitType permitType,
        ExternalPermitStatus status,
        String referenceNumber,
        LocalDate issuedDate,
        LocalDate expiryDate,
        String notes,
        String updatedBy,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ExternalPermitResponse from(ExternalPermit p) {
        return new ExternalPermitResponse(
                p.id, p.operation.id, p.permitType, p.status,
                p.referenceNumber, p.issuedDate, p.expiryDate,
                p.notes, p.updatedBy, p.createdAt, p.updatedAt
        );
    }
}
