package com.janus.document.api.dto;

import com.janus.document.domain.model.DocumentVersion;
import java.time.LocalDateTime;

public record DocumentVersionResponse(
        Long id,
        int versionNumber,
        String originalName,
        long fileSize,
        String mimeType,
        String uploadedByUsername,
        LocalDateTime uploadedAt
) {
    public static DocumentVersionResponse from(DocumentVersion v) {
        return new DocumentVersionResponse(
                v.id,
                v.versionNumber,
                v.originalName,
                v.fileSize,
                v.mimeType,
                v.uploadedBy != null ? v.uploadedBy.username : null,
                v.uploadedAt
        );
    }
}
