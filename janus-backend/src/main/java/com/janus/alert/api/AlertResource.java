package com.janus.alert.api;

import com.janus.alert.api.dto.AlertResponse;
import com.janus.alert.application.AlertService;
import com.janus.operation.application.OperationService;
import com.janus.shared.infrastructure.security.SecurityHelper;
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

    @Inject
    SecurityHelper securityHelper;

    @Inject
    OperationService operationService;

    @GET
    @RolesAllowed({"ADMIN", "AGENT"})
    public List<AlertResponse> getActiveAlerts() {
        return alertService.getActiveAlerts().stream()
                .map(AlertResponse::from)
                .toList();
    }

    @GET
    @Path("/operations/{operationId}")
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CLIENT"})
    public List<AlertResponse> getByOperation(@PathParam("operationId") Long operationId,
                                               @Context SecurityContext sec) {
        securityHelper.enforceClientAccess(sec, operationService.findById(operationId));
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
