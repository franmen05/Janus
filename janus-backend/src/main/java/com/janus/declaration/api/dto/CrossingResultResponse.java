package com.janus.declaration.api.dto;

import com.janus.declaration.domain.model.CrossingResult;
import com.janus.declaration.domain.model.CrossingStatus;
import java.time.LocalDateTime;
import java.util.List;

public record CrossingResultResponse(
        Long id,
        Long operationId,
        Long preliminaryDeclarationId,
        Long finalDeclarationId,
        CrossingStatus status,
        String resolvedBy,
        String resolutionComment,
        LocalDateTime resolvedAt,
        List<CrossingDiscrepancyResponse> discrepancies,
        LocalDateTime createdAt
) {
    public static CrossingResultResponse from(CrossingResult cr, List<CrossingDiscrepancyResponse> discrepancies) {
        return new CrossingResultResponse(
                cr.id, cr.operation.id,
                cr.preliminaryDeclaration.id, cr.finalDeclaration.id,
                cr.status, cr.resolvedBy, cr.resolutionComment, cr.resolvedAt,
                discrepancies, cr.createdAt
        );
    }
}
