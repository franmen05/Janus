package com.janus.operation.api.dto;

import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.model.StatusHistory;
import java.time.LocalDateTime;

public record StatusHistoryResponse(
        Long id,
        OperationStatus previousStatus,
        OperationStatus newStatus,
        String changedByUsername,
        String comment,
        LocalDateTime changedAt,
        String ipAddress
) {
    public static StatusHistoryResponse from(StatusHistory h) {
        return new StatusHistoryResponse(
                h.id,
                h.previousStatus,
                h.newStatus,
                h.changedBy != null ? h.changedBy.username : null,
                h.comment,
                h.changedAt,
                h.ipAddress
        );
    }
}
