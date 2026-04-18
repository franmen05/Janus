package com.janus.warehouse.api;

import com.janus.shared.api.dto.CsvImportResponse;
import com.janus.warehouse.api.dto.CreateWarehouseRequest;
import com.janus.warehouse.api.dto.WarehouseResponse;
import com.janus.warehouse.application.WarehouseCsvService;
import com.janus.warehouse.application.WarehouseService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
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
import com.janus.shared.infrastructure.exception.BusinessException;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@Path("/api/warehouses")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class WarehouseResource {

    @Inject
    WarehouseService warehouseService;

    @Inject
    WarehouseCsvService warehouseCsvService;

    @GET
    @RolesAllowed({"SUPERVISOR", "ADMIN", "AGENT"})
    public List<WarehouseResponse> list(@QueryParam("includeInactive") boolean includeInactive) {
        return warehouseService.listAll(includeInactive).stream()
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

    @PATCH
    @Path("/{id}/toggle-active")
    @RolesAllowed({"SUPERVISOR", "ADMIN"})
    public WarehouseResponse toggleActive(@PathParam("id") Long id, @Context SecurityContext sec) {
        return WarehouseResponse.from(warehouseService.toggleActive(id, sec.getUserPrincipal().getName()));
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed({"SUPERVISOR", "ADMIN"})
    public Response delete(@PathParam("id") Long id, @Context SecurityContext sec) {
        warehouseService.delete(id, sec.getUserPrincipal().getName());
        return Response.noContent().build();
    }

    @GET
    @Path("/export")
    @Produces("text/csv")
    @RolesAllowed({"SUPERVISOR", "ADMIN", "AGENT"})
    public Response exportCsv(@QueryParam("includeInactive") boolean includeInactive) {
        String csv = warehouseCsvService.exportCsv(includeInactive);
        return Response.ok(csv)
                .type("text/csv; charset=UTF-8")
                .header("Content-Disposition", "attachment; filename=\"warehouses.csv\"")
                .build();
    }

    @POST
    @Path("/import")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({"SUPERVISOR", "ADMIN"})
    public CsvImportResponse importCsv(@RestForm("file") FileUpload file,
                                        @Context SecurityContext sec) {
        if (file == null) throw new BusinessException("MISSING_FILE", "CSV file is required");
        try (var stream = Files.newInputStream(file.uploadedFile())) {
            return warehouseCsvService.importCsv(stream, sec.getUserPrincipal().getName());
        } catch (IOException e) {
            throw new BusinessException("CSV_READ_ERROR", "Failed to read uploaded file");
        }
    }
}
