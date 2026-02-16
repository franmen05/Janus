package com.janus.document.domain.repository;

import com.janus.document.domain.model.Document;
import com.janus.document.domain.model.DocumentType;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class DocumentRepository implements PanacheRepository<Document> {

    public List<Document> findByOperationId(Long operationId) {
        return list("operation.id = ?1 AND active = true", operationId);
    }

    public Optional<Document> findByOperationAndType(Long operationId, DocumentType type) {
        return find("operation.id = ?1 AND documentType = ?2 AND active = true", operationId, type)
                .firstResultOptional();
    }

    public long countByOperationId(Long operationId) {
        return count("operation.id = ?1 AND active = true", operationId);
    }
}
