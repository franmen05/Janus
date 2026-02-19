package com.janus.dashboard.api;

import com.janus.dashboard.api.dto.DashboardFilter;
import com.janus.dashboard.api.dto.DashboardMetrics;
import com.janus.dashboard.application.DashboardService;
import com.janus.operation.domain.model.OperationCategory;
import com.janus.operation.domain.model.TransportMode;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.time.LocalDate;

@Path("/api/dashboard")
@Produces(MediaType.APPLICATION_JSON)
public class DashboardResource {

    @Inject
    DashboardService dashboardService;

    @GET
    @Path("/metrics")
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING"})
    public DashboardMetrics getMetrics(
            @QueryParam("from") LocalDate from,
            @QueryParam("to") LocalDate to,
            @QueryParam("transportMode") TransportMode transportMode,
            @QueryParam("operationCategory") OperationCategory operationCategory,
            @QueryParam("agentUsername") String agentUsername) {
        var filter = new DashboardFilter(from, to, transportMode, operationCategory, agentUsername);
        return dashboardService.getMetrics(filter);
    }
}
