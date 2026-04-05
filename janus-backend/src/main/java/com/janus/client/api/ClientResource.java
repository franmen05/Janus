package com.janus.client.api;

import com.janus.client.api.dto.ClientResponse;
import com.janus.client.api.dto.CreateClientRequest;
import com.janus.client.application.ClientService;
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

@Path("/api/clients")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ClientResource {

    @Inject
    ClientService clientService;

    @GET
    @RolesAllowed({"ADMIN", "SUPERVISOR", "AGENT"})
    public List<ClientResponse> list() {
        return clientService.listAll().stream()
                .map(ClientResponse::from)
                .toList();
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"ADMIN", "SUPERVISOR", "AGENT"})
    public ClientResponse getById(@PathParam("id") Long id) {
        return ClientResponse.from(clientService.findById(id));
    }

    @POST
    @RolesAllowed({"ADMIN", "SUPERVISOR", "AGENT"})
    public Response create(@Valid CreateClientRequest request, @Context SecurityContext sec) {
        var client = clientService.create(request, sec.getUserPrincipal().getName());
        return Response.status(Response.Status.CREATED)
                .entity(ClientResponse.from(client))
                .build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed({"ADMIN", "SUPERVISOR", "AGENT"})
    public ClientResponse update(@PathParam("id") Long id, @Valid CreateClientRequest request, @Context SecurityContext sec) {
        return ClientResponse.from(clientService.update(id, request, sec.getUserPrincipal().getName()));
    }
}
