package com.janus.audit.domain.model;

public record AuditEvent(
        String username,
        AuditAction action,
        String entityName,
        Long entityId,
        Long operationId,
        String previousData,
        String newData,
        String details
) {}
