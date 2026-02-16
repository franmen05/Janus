package com.janus.document.domain.service;

import com.janus.document.domain.model.DocumentStatus;
import com.janus.shared.infrastructure.exception.BusinessException;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Set;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class DocumentValidationService {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/png"
    );

    @ConfigProperty(name = "janus.storage.max-file-size", defaultValue = "10485760")
    long maxFileSize;

    public void validateFile(String mimeType, long fileSize) {
        if (!ALLOWED_MIME_TYPES.contains(mimeType)) {
            throw new BusinessException("File type not allowed: " + mimeType
                    + ". Allowed types: PDF, JPG, PNG");
        }

        if (fileSize > maxFileSize) {
            throw new BusinessException("File size exceeds maximum allowed: "
                    + (maxFileSize / 1024 / 1024) + " MB");
        }

        if (fileSize == 0) {
            throw new BusinessException("File is empty or corrupted");
        }
    }

    public DocumentStatus determineStatus(String mimeType, long fileSize) {
        if (fileSize > 0 && ALLOWED_MIME_TYPES.contains(mimeType)) {
            return DocumentStatus.VALIDATED;
        }
        return DocumentStatus.OBSERVED;
    }
}
