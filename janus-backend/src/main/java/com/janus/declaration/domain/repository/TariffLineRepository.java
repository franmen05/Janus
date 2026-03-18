package com.janus.declaration.domain.repository;

import com.janus.declaration.domain.model.TariffLine;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class TariffLineRepository implements PanacheRepository<TariffLine> {

    public List<TariffLine> findByDeclarationId(Long declarationId) {
        return list("declaration.id = ?1 ORDER BY lineNumber ASC", declarationId);
    }

    public long deleteByOperationId(Long operationId) {
        return delete("declaration.id IN (SELECT d.id FROM Declaration d WHERE d.operation.id = ?1)", operationId);
    }
}
