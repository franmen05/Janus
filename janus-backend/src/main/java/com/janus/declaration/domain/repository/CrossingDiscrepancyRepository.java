package com.janus.declaration.domain.repository;

import com.janus.declaration.domain.model.CrossingDiscrepancy;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class CrossingDiscrepancyRepository implements PanacheRepository<CrossingDiscrepancy> {

    public List<CrossingDiscrepancy> findByCrossingResultId(Long crossingResultId) {
        return list("crossingResult.id = ?1", crossingResultId);
    }
}
