package com.janus.dashboard.api.dto;

import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.TransportMode;
import java.time.LocalDate;

public record DashboardFilter(
        LocalDate from,
        LocalDate to,
        TransportMode transportMode,
        OperationCategory operationCategory,
        String agentUsername
) {}
