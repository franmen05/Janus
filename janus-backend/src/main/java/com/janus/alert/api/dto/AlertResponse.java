package com.janus.alert.api.dto;

import com.janus.alert.domain.model.Alert;
import com.janus.alert.domain.model.AlertStatus;
import com.janus.alert.domain.model.AlertType;
import java.time.LocalDateTime;

public record AlertResponse(
        Long id,
        Long operationId,
        String operationRef,
        AlertType alertType,
        AlertStatus status,
        String message,
        String acknowledgedBy,
        LocalDateTime acknowledgedAt,
        LocalDateTime createdAt
) {
    public static AlertResponse from(Alert alert) {
        return new AlertResponse(
                alert.id,
                alert.operation != null ? alert.operation.id : null,
                alert.operation != null ? alert.operation.referenceNumber : null,
                alert.alertType,
                alert.status,
                alert.message,
                alert.acknowledgedBy,
                alert.acknowledgedAt,
                alert.createdAt
        );
    }
}
