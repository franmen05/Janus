package com.janus.document.domain.service;

import com.janus.document.domain.model.DocumentType;
import com.janus.document.domain.repository.DocumentRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@ApplicationScoped
public class DocumentCompletenessService {

    private static final Set<DocumentType> MANDATORY_DOCUMENTS = Set.of(
            DocumentType.BL,
            DocumentType.COMMERCIAL_INVOICE,
            DocumentType.PACKING_LIST
    );

    @Inject
    DocumentRepository documentRepository;

    public CompletenessResult calculate(Long operationId) {
        var presentTypes = new java.util.HashSet<DocumentType>();
        var docs = documentRepository.findByOperationId(operationId);
        docs.forEach(d -> presentTypes.add(d.documentType));

        var missing = new ArrayList<DocumentType>();
        for (var mandatory : MANDATORY_DOCUMENTS) {
            if (!presentTypes.contains(mandatory)) {
                missing.add(mandatory);
            }
        }

        int total = MANDATORY_DOCUMENTS.size();
        int present = total - missing.size();
        int percentage = (int) ((present * 100.0) / total);

        String color;
        if (percentage == 100) {
            color = "GREEN";
        } else if (percentage >= 50) {
            color = "YELLOW";
        } else {
            color = "RED";
        }

        return new CompletenessResult(percentage, missing, color);
    }

    public record CompletenessResult(
            int percentage,
            List<DocumentType> missingDocuments,
            String color
    ) {}
}
