package com.janus.dashboard.application;

import com.janus.dashboard.api.dto.DashboardFilter;
import com.janus.dashboard.api.dto.DashboardMetrics;
import com.janus.operation.domain.model.OperationStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class DashboardService {

    @Inject
    EntityManager em;

    public DashboardMetrics getMetrics(DashboardFilter filter) {
        return new DashboardMetrics(
                getOperationsByStatus(filter),
                getOverdueCount(filter),
                getAverageTimePerStage(filter),
                getRejectionRate(filter),
                getProductivityByAgent(filter)
        );
    }

    private Map<String, Long> getOperationsByStatus(DashboardFilter filter) {
        var jpql = "SELECT o.status, COUNT(o) FROM Operation o WHERE 1=1"
                + buildFilterConditions(filter)
                + " GROUP BY o.status";
        var query = em.createQuery(jpql, Object[].class);
        applyFilterParams(query, filter);

        var result = new LinkedHashMap<String, Long>();
        for (var status : OperationStatus.values()) {
            result.put(status.name(), 0L);
        }
        for (var row : query.getResultList()) {
            result.put(((OperationStatus) row[0]).name(), (Long) row[1]);
        }
        return result;
    }

    private long getOverdueCount(DashboardFilter filter) {
        var jpql = "SELECT COUNT(o) FROM Operation o"
                + " WHERE o.status NOT IN (com.janus.operation.domain.model.OperationStatus.CLOSED,"
                + " com.janus.operation.domain.model.OperationStatus.CANCELLED)"
                + " AND o.deadline IS NOT NULL AND o.deadline < CURRENT_TIMESTAMP"
                + buildFilterConditions(filter);
        var query = em.createQuery(jpql, Long.class);
        applyFilterParams(query, filter);
        return query.getSingleResult();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Double> getAverageTimePerStage(DashboardFilter filter) {
        // Simple implementation: compute from status history
        try {
            var jpql = "SELECT sh.newStatus, AVG("
                    + "FUNCTION('TIMESTAMPDIFF', HOUR, sh.changedAt,"
                    + " (SELECT MIN(sh2.changedAt) FROM StatusHistory sh2"
                    + " WHERE sh2.operation = sh.operation AND sh2.changedAt > sh.changedAt))"
                    + ") FROM StatusHistory sh"
                    + " WHERE sh.newStatus NOT IN (com.janus.operation.domain.model.OperationStatus.CLOSED,"
                    + " com.janus.operation.domain.model.OperationStatus.CANCELLED)"
                    + " GROUP BY sh.newStatus";
            var query = em.createQuery(jpql);
            var result = new LinkedHashMap<String, Double>();
            for (var row : (List<Object[]>) query.getResultList()) {
                var status = (OperationStatus) row[0];
                var avg = row[1] != null ? ((Number) row[1]).doubleValue() : 0.0;
                result.put(status.name(), avg);
            }
            return result;
        } catch (Exception e) {
            return Map.of();
        }
    }

    private double getRejectionRate(DashboardFilter filter) {
        var totalJpql = "SELECT COUNT(o) FROM Operation o WHERE 1=1" + buildFilterConditions(filter);
        var cancelledJpql = "SELECT COUNT(o) FROM Operation o WHERE o.status ="
                + " com.janus.operation.domain.model.OperationStatus.CANCELLED"
                + buildFilterConditions(filter);

        var totalQuery = em.createQuery(totalJpql, Long.class);
        applyFilterParams(totalQuery, filter);
        long total = totalQuery.getSingleResult();

        if (total == 0) return 0.0;

        var cancelledQuery = em.createQuery(cancelledJpql, Long.class);
        applyFilterParams(cancelledQuery, filter);
        long cancelled = cancelledQuery.getSingleResult();

        return (cancelled * 100.0) / total;
    }

    @SuppressWarnings("unchecked")
    private List<DashboardMetrics.AgentProductivity> getProductivityByAgent(DashboardFilter filter) {
        var jpql = "SELECT u.username, u.fullName, COUNT(o),"
                + " SUM(CASE WHEN o.status = com.janus.operation.domain.model.OperationStatus.CLOSED"
                + " THEN 1 ELSE 0 END)"
                + " FROM Operation o JOIN o.assignedAgent u WHERE 1=1"
                + buildFilterConditions(filter)
                + " GROUP BY u.username, u.fullName ORDER BY COUNT(o) DESC";
        var query = em.createQuery(jpql);
        applyFilterParams(query, filter);

        var result = new ArrayList<DashboardMetrics.AgentProductivity>();
        for (var row : (List<Object[]>) query.getResultList()) {
            result.add(new DashboardMetrics.AgentProductivity(
                    (String) row[0], (String) row[1],
                    ((Number) row[2]).longValue(), ((Number) row[3]).longValue()
            ));
        }
        return result;
    }

    private String buildFilterConditions(DashboardFilter filter) {
        var sb = new StringBuilder();
        if (filter.from() != null) sb.append(" AND o.createdAt >= :fromDate");
        if (filter.to() != null) sb.append(" AND o.createdAt <= :toDate");
        if (filter.cargoType() != null) sb.append(" AND o.cargoType = :cargoType");
        if (filter.inspectionType() != null) sb.append(" AND o.inspectionType = :inspectionType");
        if (filter.agentUsername() != null) sb.append(" AND o.assignedAgent.username = :agentUsername");
        return sb.toString();
    }

    private void applyFilterParams(jakarta.persistence.Query query, DashboardFilter filter) {
        if (filter.from() != null) query.setParameter("fromDate", filter.from().atStartOfDay());
        if (filter.to() != null) query.setParameter("toDate", filter.to().atTime(23, 59, 59));
        if (filter.cargoType() != null) query.setParameter("cargoType", filter.cargoType());
        if (filter.inspectionType() != null) query.setParameter("inspectionType", filter.inspectionType());
        if (filter.agentUsername() != null) query.setParameter("agentUsername", filter.agentUsername());
    }
}
