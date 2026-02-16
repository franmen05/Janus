package com.janus.operation.api;

import com.janus.operation.api.dto.ChangeStatusRequest;
import com.janus.operation.api.dto.CreateOperationRequest;
import com.janus.operation.api.dto.OperationResponse;
import com.janus.operation.api.dto.StatusHistoryResponse;
import com.janus.operation.application.OperationService;
import com.janus.operation.domain.model.OperationStatus;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
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

@Path("/api/operations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class OperationResource {

    @Inject
    OperationService operationService;

    @GET
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CLIENT"})
    public List<OperationResponse> list(
            @QueryParam("status") OperationStatus status,
            @QueryParam("clientId") Long clientId) {
        List<OperationResponse> results;
        if (status != null) {
            results = operationService.findByStatus(status).stream()
                    .map(OperationResponse::from)
                    .toList();
        } else if (clientId != null) {
            results = operationService.findByClientId(clientId).stream()
                    .map(OperationResponse::from)
                    .toList();
        } else {
            results = operationService.listAll().stream()
                    .map(OperationResponse::from)
                    .toList();
        }
        return results;
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CLIENT"})
    public OperationResponse getById(@PathParam("id") Long id) {
        return OperationResponse.from(operationService.findById(id));
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
    public OperationResponse update(@PathParam("id") Long id, @Valid CreateOperationRequest request) {
        return OperationResponse.from(operationService.update(id, request));
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

    @GET
    @Path("/{id}/history")
    @RolesAllowed({"ADMIN", "AGENT", "CLIENT"})
    public List<StatusHistoryResponse> getHistory(@PathParam("id") Long id) {
        return operationService.getHistory(id).stream()
                .map(StatusHistoryResponse::from)
                .toList();
    }
}
