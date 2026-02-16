package com.janus.alert.api;

import com.janus.alert.api.dto.AlertResponse;
import com.janus.alert.application.AlertService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.SecurityContext;
import java.util.List;

@Path("/api/alerts")
@Produces(MediaType.APPLICATION_JSON)
public class AlertResource {

    @Inject
    AlertService alertService;

    @GET
    @RolesAllowed({"ADMIN", "AGENT"})
    public List<AlertResponse> getActiveAlerts() {
        return alertService.getActiveAlerts().stream()
                .map(AlertResponse::from)
                .toList();
    }

    @GET
    @Path("/operations/{operationId}")
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING"})
    public List<AlertResponse> getByOperation(@PathParam("operationId") Long operationId) {
        return alertService.getAlertsByOperationId(operationId).stream()
                .map(AlertResponse::from)
                .toList();
    }

    @POST
    @Path("/{id}/acknowledge")
    @RolesAllowed({"ADMIN", "AGENT"})
    @Transactional
    public AlertResponse acknowledge(@PathParam("id") Long id, @Context SecurityContext sec) {
        return AlertResponse.from(alertService.acknowledge(id, sec.getUserPrincipal().getName()));
    }
}
