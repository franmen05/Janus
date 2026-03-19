package com.janus.port.api;

import com.janus.port.api.dto.CreatePortRequest;
import com.janus.port.api.dto.PortResponse;
import com.janus.port.application.PortService;
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

@Path("/api/ports")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PortResource {

    @Inject
    PortService portService;

    @GET
    @RolesAllowed({"ADMIN", "AGENT"})
    public List<PortResponse> list() {
        return portService.listAll().stream()
                .map(PortResponse::from)
                .toList();
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"ADMIN", "AGENT"})
    public PortResponse getById(@PathParam("id") Long id) {
        return PortResponse.from(portService.findById(id));
    }

    @POST
    @RolesAllowed("ADMIN")
    public Response create(@Valid CreatePortRequest request, @Context SecurityContext sec) {
        var port = portService.create(request, sec.getUserPrincipal().getName());
        return Response.status(Response.Status.CREATED)
                .entity(PortResponse.from(port))
                .build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("ADMIN")
    public PortResponse update(@PathParam("id") Long id, @Valid CreatePortRequest request, @Context SecurityContext sec) {
        return PortResponse.from(portService.update(id, request, sec.getUserPrincipal().getName()));
    }
}
