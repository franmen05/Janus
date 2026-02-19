package com.janus.operation.api;

import com.janus.operation.api.dto.ChangeStatusRequest;
import com.janus.operation.api.dto.CreateOperationRequest;
import com.janus.operation.api.dto.OperationResponse;
import com.janus.operation.api.dto.StatusHistoryResponse;
import com.janus.operation.application.OperationService;
import com.janus.operation.domain.model.OperationStatus;
import com.janus.operation.domain.service.StatusTransitionService;
import com.janus.shared.infrastructure.security.SecurityHelper;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import java.util.List;
import java.util.Set;

@Path("/api/operations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class OperationResource {

    @Inject
    OperationService operationService;

    @Inject
    StatusTransitionService statusTransitionService;

    @Inject
    SecurityHelper securityHelper;

    @GET
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CLIENT"})
    public List<OperationResponse> list(
            @QueryParam("status") OperationStatus status,
            @QueryParam("clientId") Long clientId,
            @Context SecurityContext sec) {
        var clientIdFilter = securityHelper.getClientIdFilter(sec);
        if (clientIdFilter != null) {
            // CLIENT users can only see their own operations
            return operationService.findByClientId(clientIdFilter).stream()
                    .map(OperationResponse::from)
                    .toList();
        }

        if (status != null) {
            return operationService.findByStatus(status).stream()
                    .map(OperationResponse::from)
                    .toList();
        } else if (clientId != null) {
            return operationService.findByClientId(clientId).stream()
                    .map(OperationResponse::from)
                    .toList();
        } else {
            return operationService.listAll().stream()
                    .map(OperationResponse::from)
                    .toList();
        }
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CLIENT"})
    public OperationResponse getById(@PathParam("id") Long id, @Context SecurityContext sec) {
        var op = operationService.findById(id);
        securityHelper.enforceClientAccess(sec, op);
        return OperationResponse.from(op);
    }

    @POST
    @RolesAllowed({"ADMIN", "AGENT"})
    public Response create(@Valid CreateOperationRequest request, @Context SecurityContext sec) {
        var op = operationService.create(request, sec.getUserPrincipal().getName());
        return Response.status(Response.Status.CREATED)
                .entity(OperationResponse.from(op))
                .build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed({"ADMIN", "AGENT"})
    public OperationResponse update(@PathParam("id") Long id, @Valid CreateOperationRequest request,
                                     @Context SecurityContext sec) {
        return OperationResponse.from(operationService.update(id, request, sec.getUserPrincipal().getName()));
    }

    @POST
    @Path("/{id}/change-status")
    @RolesAllowed({"ADMIN", "AGENT"})
    public Response changeStatus(@PathParam("id") Long id,
                                  @Valid ChangeStatusRequest request,
                                  @Context SecurityContext sec) {
        operationService.changeStatus(id, request, sec.getUserPrincipal().getName(), null);
        return Response.ok().build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed({"ADMIN"})
    public Response delete(@PathParam("id") Long id, @Context SecurityContext sec) {
        operationService.delete(id, sec.getUserPrincipal().getName());
        return Response.noContent().build();
    }

    @GET
    @Path("/{id}/allowed-transitions")
    @RolesAllowed({"ADMIN", "AGENT"})
    public Set<OperationStatus> getAllowedTransitions(@PathParam("id") Long id) {
        var op = operationService.findById(id);
        return statusTransitionService.getAllowedTransitions(op.status);
    }

    @GET
    @Path("/{id}/history")
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CLIENT"})
    public List<StatusHistoryResponse> getHistory(@PathParam("id") Long id, @Context SecurityContext sec) {
        securityHelper.enforceClientAccess(sec, operationService.findById(id));
        return operationService.getHistory(id).stream()
                .map(StatusHistoryResponse::from)
                .toList();
    }
}
