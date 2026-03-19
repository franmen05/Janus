package com.janus.inspection.api;

import com.janus.inspection.api.dto.CreateExpenseCategoryRequest;
import com.janus.inspection.api.dto.ExpenseCategoryResponse;
import com.janus.inspection.api.dto.UpdateExpenseCategoryRequest;
import com.janus.inspection.application.ExpenseCategoryConfigService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
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

@Path("/api/expense-categories")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ExpenseCategoryResource {

    @Inject
    ExpenseCategoryConfigService service;

    @GET
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING"})
    @Transactional
    public List<ExpenseCategoryResponse> listActive() {
        return service.listActive().stream()
                .map(ExpenseCategoryResponse::from)
                .toList();
    }

    @GET
    @Path("/all")
    @RolesAllowed("ADMIN")
    @Transactional
    public List<ExpenseCategoryResponse> listAll() {
        return service.listAll().stream()
                .map(ExpenseCategoryResponse::from)
                .toList();
    }

    @POST
    @RolesAllowed("ADMIN")
    public Response create(@Valid CreateExpenseCategoryRequest request,
                           @Context SecurityContext sec) {
        var config = service.create(request, sec.getUserPrincipal().getName());
        return Response.status(Response.Status.CREATED)
                .entity(ExpenseCategoryResponse.from(config))
                .build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("ADMIN")
    public ExpenseCategoryResponse update(@PathParam("id") Long id,
                                          @Valid UpdateExpenseCategoryRequest request,
                                          @Context SecurityContext sec) {
        var config = service.update(id, request, sec.getUserPrincipal().getName());
        return ExpenseCategoryResponse.from(config);
    }

    @PUT
    @Path("/{id}/toggle")
    @RolesAllowed("ADMIN")
    public ExpenseCategoryResponse toggleActive(@PathParam("id") Long id,
                                                @Context SecurityContext sec) {
        var config = service.toggleActive(id, sec.getUserPrincipal().getName());
        return ExpenseCategoryResponse.from(config);
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("ADMIN")
    public Response delete(@PathParam("id") Long id,
                           @Context SecurityContext sec) {
        service.delete(id, sec.getUserPrincipal().getName());
        return Response.noContent().build();
    }
}
