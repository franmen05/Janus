package com.janus.document.api.dto;

import com.janus.document.domain.model.DocumentType;
import com.janus.document.domain.service.DocumentCompletenessService;
import java.util.List;

public record CompletenessResponse(
        int percentage,
        List<DocumentType> missingDocuments,
        String color
) {
    public static CompletenessResponse from(DocumentCompletenessService.CompletenessResult result) {
        return new CompletenessResponse(
                result.percentage(),
                result.missingDocuments(),
                result.color()
        );
    }
}
