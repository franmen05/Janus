package com.janus.deposito.api;

import com.janus.deposito.api.dto.CreateDepositoRequest;
import com.janus.deposito.api.dto.DepositoResponse;
import com.janus.deposito.application.DepositoService;
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
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import java.util.List;

@Path("/api/depositos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DepositoResource {

    @Inject
    DepositoService depositoService;

    @GET
    @RolesAllowed({"SUPERVISOR", "ADMIN", "AGENT"})
    public List<DepositoResponse> list() {
        return depositoService.listAll().stream()
                .map(DepositoResponse::from)
                .toList();
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"SUPERVISOR", "ADMIN", "AGENT"})
    public DepositoResponse getById(@PathParam("id") Long id) {
        return DepositoResponse.from(depositoService.findById(id));
    }

    @POST
    @RolesAllowed({"ADMIN", "SUPERVISOR"})
    public Response create(@Valid CreateDepositoRequest request, @Context SecurityContext sec) {
        var deposito = depositoService.create(request, sec.getUserPrincipal().getName());
        return Response.status(Response.Status.CREATED)
                .entity(DepositoResponse.from(deposito))
                .build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed({"ADMIN", "SUPERVISOR"})
    public DepositoResponse update(@PathParam("id") Long id, @Valid CreateDepositoRequest request, @Context SecurityContext sec) {
        return DepositoResponse.from(depositoService.update(id, request, sec.getUserPrincipal().getName()));
    }
}
