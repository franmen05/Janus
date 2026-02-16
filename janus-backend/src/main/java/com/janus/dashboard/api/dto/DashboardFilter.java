package com.janus.dashboard.api.dto;

import com.janus.operation.domain.model.CargoType;
import com.janus.operation.domain.model.InspectionType;
import java.time.LocalDate;

public record DashboardFilter(
        LocalDate from,
        LocalDate to,
        CargoType cargoType,
        InspectionType inspectionType,
        String agentUsername
) {}
