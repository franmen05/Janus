package com.janus.inspection.domain.repository;

import com.janus.inspection.domain.model.InspectionExpense;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.util.List;

@ApplicationScoped
public class InspectionExpenseRepository implements PanacheRepository<InspectionExpense> {

    @Inject
    EntityManager em;

    public List<InspectionExpense> findByOperationId(Long operationId) {
        return list("operation.id = ?1 and active = true order by expenseDate desc", operationId);
    }

    public BigDecimal sumAmountByOperationId(Long operationId) {
        var result = em.createQuery(
                        "select coalesce(sum(e.amount), 0) from InspectionExpense e where e.operation.id = :opId and e.active = true",
                        BigDecimal.class)
                .setParameter("opId", operationId)
                .getSingleResult();
        return result != null ? result : BigDecimal.ZERO;
    }
}
