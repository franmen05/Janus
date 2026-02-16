package com.janus.audit.api.dto;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditLog;
import java.time.LocalDateTime;

public record AuditLogResponse(
        Long id,
        String username,
        String ipAddress,
        AuditAction action,
        String entityName,
        Long entityId,
        Long operationId,
        String previousData,
        String newData,
        String details,
        LocalDateTime createdAt
) {
    public static AuditLogResponse from(AuditLog log) {
        return new AuditLogResponse(
                log.id,
                log.username,
                log.ipAddress,
                log.action,
                log.entityName,
                log.entityId,
                log.operationId,
                log.previousData,
                log.newData,
                log.details,
                log.createdAt
        );
    }
}
