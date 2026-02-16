package com.janus.document.api.dto;

import com.janus.document.domain.model.Document;
import com.janus.document.domain.model.DocumentStatus;
import com.janus.document.domain.model.DocumentType;
import java.time.LocalDateTime;

public record DocumentResponse(
        Long id,
        Long operationId,
        DocumentType documentType,
        DocumentStatus status,
        boolean active,
        String latestVersionName,
        Long latestVersionSize,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static DocumentResponse from(Document doc) {
        return new DocumentResponse(
                doc.id,
                doc.operation != null ? doc.operation.id : null,
                doc.documentType,
                doc.status,
                doc.active,
                null,
                null,
                doc.createdAt,
                doc.updatedAt
        );
    }

    public static DocumentResponse from(Document doc, String latestVersionName, Long latestVersionSize) {
        return new DocumentResponse(
                doc.id,
                doc.operation != null ? doc.operation.id : null,
                doc.documentType,
                doc.status,
                doc.active,
                latestVersionName,
                latestVersionSize,
                doc.createdAt,
                doc.updatedAt
        );
    }
}
