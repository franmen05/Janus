package com.janus.inspection.api;

import com.janus.inspection.api.dto.CreateServiceRequest;
import com.janus.inspection.api.dto.ServiceResponse;
import com.janus.inspection.api.dto.UpdateServiceRequest;
import com.janus.inspection.application.ServiceConfigService;
import com.janus.inspection.application.ServiceCsvService;
import com.janus.shared.api.dto.CsvImportResponse;
import com.janus.shared.infrastructure.exception.BusinessException;
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
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@Path("/api/services")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ServiceResource {

    @Inject
    ServiceConfigService service;

    @Inject
    ServiceCsvService serviceCsvService;

    @GET
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING"})
    @Transactional
    public List<ServiceResponse> listActive() {
        return service.listActive().stream()
                .map(ServiceResponse::from)
                .toList();
    }

    @GET
    @Path("/all")
    @RolesAllowed("ADMIN")
    @Transactional
    public List<ServiceResponse> listAll() {
        return service.listAll().stream()
                .map(ServiceResponse::from)
                .toList();
    }

    @POST
    @RolesAllowed("ADMIN")
    public Response create(@Valid CreateServiceRequest request,
                           @Context SecurityContext sec) {
        var config = service.create(request, sec.getUserPrincipal().getName());
        return Response.status(Response.Status.CREATED)
                .entity(ServiceResponse.from(config))
                .build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("ADMIN")
    public ServiceResponse update(@PathParam("id") Long id,
                                          @Valid UpdateServiceRequest request,
                                          @Context SecurityContext sec) {
        var config = service.update(id, request, sec.getUserPrincipal().getName());
        return ServiceResponse.from(config);
    }

    @PUT
    @Path("/{id}/toggle")
    @RolesAllowed("ADMIN")
    public ServiceResponse toggleActive(@PathParam("id") Long id,
                                                @Context SecurityContext sec) {
        var config = service.toggleActive(id, sec.getUserPrincipal().getName());
        return ServiceResponse.from(config);
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("ADMIN")
    public Response delete(@PathParam("id") Long id,
                           @Context SecurityContext sec) {
        service.delete(id, sec.getUserPrincipal().getName());
        return Response.noContent().build();
    }

    @GET
    @Path("/export")
    @Produces("text/csv")
    @RolesAllowed("ADMIN")
    public Response exportCsv() {
        String csv = serviceCsvService.exportCsv();
        return Response.ok(csv)
                .type("text/csv; charset=UTF-8")
                .header("Content-Disposition", "attachment; filename=\"services.csv\"")
                .build();
    }

    @POST
    @Path("/import")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("ADMIN")
    public CsvImportResponse importCsv(@RestForm("file") FileUpload file,
                                        @Context SecurityContext sec) {
        if (file == null) throw new BusinessException("MISSING_FILE", "CSV file is required");
        try (var stream = Files.newInputStream(file.uploadedFile())) {
            return serviceCsvService.importCsv(stream, sec.getUserPrincipal().getName());
        } catch (IOException e) {
            throw new BusinessException("CSV_READ_ERROR", "Failed to read uploaded file");
        }
    }
}
