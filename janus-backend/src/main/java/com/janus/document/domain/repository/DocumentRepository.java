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

    public List<Document> findAllByOperationId(Long operationId) {
        return list("operation.id = ?1", operationId);
    }

    public Optional<Document> findByOperationAndTypeAndName(Long operationId, DocumentType type, String originalName) {
        return find("FROM Document d WHERE d.operation.id = ?1 AND d.documentType = ?2 AND d.active = true " +
                        "AND EXISTS (SELECT 1 FROM DocumentVersion v WHERE v.document = d AND v.originalName = ?3)",
                operationId, type, originalName)
                .firstResultOptional();
    }

    public long deleteByOperationId(Long operationId) {
        return delete("operation.id", operationId);
    }

    public long countByOperationId(Long operationId) {
        return count("operation.id = ?1 AND active = true", operationId);
    }
}
