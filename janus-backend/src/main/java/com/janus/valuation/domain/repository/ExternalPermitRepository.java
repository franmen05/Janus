package com.janus.valuation.domain.repository;

import com.janus.valuation.domain.model.ExternalPermit;
import com.janus.valuation.domain.model.ExternalPermitStatus;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class ExternalPermitRepository implements PanacheRepository<ExternalPermit> {

    public List<ExternalPermit> findByOperationId(Long operationId) {
        return list("operation.id = ?1", operationId);
    }

    public boolean hasBlockingPermits(Long operationId) {
        return count("operation.id = ?1 and status = ?2", operationId, ExternalPermitStatus.EN_TRAMITE) > 0;
    }

    public boolean hasAnyPermits(Long operationId) {
        return count("operation.id = ?1", operationId) > 0;
    }
}
