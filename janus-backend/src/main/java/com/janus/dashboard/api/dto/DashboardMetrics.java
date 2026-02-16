package com.janus.dashboard.api.dto;

import java.util.List;
import java.util.Map;

public record DashboardMetrics(
        Map<String, Long> operationsByStatus,
        long overdueCount,
        Map<String, Double> averageTimePerStage,
        double rejectionRate,
        List<AgentProductivity> productivityByAgent
) {
    public record AgentProductivity(
            String agentUsername,
            String agentFullName,
            long operationsHandled,
            long operationsClosed
    ) {}
}
