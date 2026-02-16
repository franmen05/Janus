package com.janus.document.domain.repository;

import com.janus.document.domain.model.DocumentVersion;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class DocumentVersionRepository implements PanacheRepository<DocumentVersion> {

    public List<DocumentVersion> findByDocumentId(Long documentId) {
        return list("document.id = ?1 ORDER BY versionNumber DESC", documentId);
    }

    public Optional<DocumentVersion> findLatestByDocumentId(Long documentId) {
        return find("document.id = ?1 ORDER BY versionNumber DESC", documentId).firstResultOptional();
    }

    public int getNextVersionNumber(Long documentId) {
        return findByDocumentId(documentId).stream()
                .mapToInt(v -> v.versionNumber)
                .max()
                .orElse(0) + 1;
    }
}
