package com.janus.inspection.api.dto;

import com.janus.inspection.domain.model.InspectionPhoto;
import java.time.LocalDateTime;

public record InspectionPhotoResponse(
        Long id,
        Long operationId,
        String uploadedByUsername,
        String uploadedByFullName,
        String originalName,
        Long fileSize,
        String mimeType,
        String caption,
        LocalDateTime createdAt
) {
    public static InspectionPhotoResponse from(InspectionPhoto photo) {
        return new InspectionPhotoResponse(
                photo.id,
                photo.operation != null ? photo.operation.id : null,
                photo.uploadedBy != null ? photo.uploadedBy.username : null,
                photo.uploadedBy != null ? photo.uploadedBy.fullName : null,
                photo.originalName,
                photo.fileSize,
                photo.mimeType,
                photo.caption,
                photo.createdAt
        );
    }
}
