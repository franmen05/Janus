package com.janus.warehouse.api;

import com.janus.warehouse.api.dto.CreateWarehouseRequest;
import com.janus.warehouse.api.dto.WarehouseResponse;
import com.janus.warehouse.application.WarehouseService;
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

@Path("/api/warehouses")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class WarehouseResource {

    @Inject
    WarehouseService warehouseService;

    @GET
    @RolesAllowed({"SUPERVISOR", "ADMIN", "AGENT"})
    public List<WarehouseResponse> list() {
        return warehouseService.listAll(false).stream()
                .map(WarehouseResponse::from)
                .toList();
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"SUPERVISOR", "ADMIN", "AGENT"})
    public WarehouseResponse getById(@PathParam("id") Long id) {
        return WarehouseResponse.from(warehouseService.findById(id));
    }

    @POST
    @RolesAllowed("SUPERVISOR")
    public Response create(@Valid CreateWarehouseRequest request, @Context SecurityContext sec) {
        var warehouse = warehouseService.create(request, sec.getUserPrincipal().getName());
        return Response.status(Response.Status.CREATED)
                .entity(WarehouseResponse.from(warehouse))
                .build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("SUPERVISOR")
    public WarehouseResponse update(@PathParam("id") Long id, @Valid CreateWarehouseRequest request, @Context SecurityContext sec) {
        return WarehouseResponse.from(warehouseService.update(id, request, sec.getUserPrincipal().getName()));
    }
}
