package com.janus.alert.api;

import com.janus.alert.api.dto.AlertResponse;
import com.janus.alert.application.AlertCheckerScheduler;
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
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import java.util.List;
import java.util.Map;

@Path("/api/alerts")
@Produces(MediaType.APPLICATION_JSON)
public class AlertResource {

    @Inject
    AlertService alertService;

    @Inject
    SecurityHelper securityHelper;

    @Inject
    OperationService operationService;

    @Inject
    AlertCheckerScheduler alertCheckerScheduler;

    @GET
    @RolesAllowed({"ADMIN","SUPERVISOR", "AGENT"})
    public List<AlertResponse> getActiveAlerts() {
        return alertService.getActiveAlerts().stream()
                .map(AlertResponse::from)
                .toList();
    }

    @GET
    @Path("/operations/{operationId}")
    @RolesAllowed({"ADMIN", "AGENT","SUPERVISOR", "ACCOUNTING", "CUSTOMER"})
    public List<AlertResponse> getByOperation(@PathParam("operationId") Long operationId,
                                               @Context SecurityContext sec) {
        securityHelper.enforceCustomerAccess(sec, operationService.findById(operationId));
        return alertService.getAlertsByOperationId(operationId).stream()
                .map(AlertResponse::from)
                .toList();
    }

    @POST
    @Path("/trigger-check")
    @RolesAllowed({"ADMIN"})
    public Response triggerCheck() {
        alertCheckerScheduler.runChecks();
        return Response.ok(Map.of("status", "done")).build();
    }

    @POST
    @Path("/{id}/acknowledge")
    @RolesAllowed({"ADMIN","SUPERVISOR", "AGENT"})
    @Transactional
    public AlertResponse acknowledge(@PathParam("id") Long id, @Context SecurityContext sec) {
        return AlertResponse.from(alertService.acknowledge(id, sec.getUserPrincipal().getName()));
    }
}
