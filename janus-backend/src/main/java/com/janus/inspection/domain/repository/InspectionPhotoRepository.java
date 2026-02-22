package com.janus.inspection.domain.repository;

import com.janus.inspection.domain.model.InspectionPhoto;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class InspectionPhotoRepository implements PanacheRepository<InspectionPhoto> {

    public List<InspectionPhoto> findByOperationId(Long operationId) {
        return list("operation.id = ?1 and active = true", operationId);
    }

    public long countByOperationId(Long operationId) {
        return count("operation.id = ?1 and active = true", operationId);
    }
}
