package com.janus.inspection.api;

import com.janus.document.infrastructure.storage.StorageService;
import com.janus.inspection.api.dto.CreateExpenseRequest;
import com.janus.inspection.api.dto.ExpenseSummaryResponse;
import com.janus.inspection.api.dto.InspectionExpenseResponse;
import com.janus.inspection.api.dto.InspectionPhotoResponse;
import com.janus.inspection.application.InspectionService;
import com.janus.operation.api.dto.SetInspectionTypeRequest;
import com.janus.operation.application.OperationService;
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
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@Path("/api/operations/{operationId}/inspection")
@Produces(MediaType.APPLICATION_JSON)
public class InspectionResource {

    @Inject
    InspectionService inspectionService;

    @Inject
    OperationService operationService;

    @Inject
    StorageService storageService;

    @Inject
    SecurityHelper securityHelper;

    @POST
    @Path("/type")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed({"ADMIN", "AGENT"})
    public Response setInspectionType(@PathParam("operationId") Long operationId,
                                       @Valid SetInspectionTypeRequest request,
                                       @Context SecurityContext sec) {
        inspectionService.setInspectionType(operationId, request.inspectionType(),
                request.comment(), sec.getUserPrincipal().getName());
        return Response.ok().build();
    }

    @POST
    @Path("/photos")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed({"ADMIN", "AGENT"})
    public Response uploadPhoto(@PathParam("operationId") Long operationId,
                                 @RestForm("file") FileUpload file,
                                 @RestForm("caption") String caption,
                                 @Context SecurityContext sec) {
        try {
            var inputStream = Files.newInputStream(file.uploadedFile());
            var photo = inspectionService.uploadPhoto(
                    operationId,
                    inputStream,
                    file.fileName(),
                    file.contentType(),
                    Files.size(file.uploadedFile()),
                    caption,
                    sec.getUserPrincipal().getName()
            );
            return Response.status(Response.Status.CREATED)
                    .entity(InspectionPhotoResponse.from(photo))
                    .build();
        } catch (IOException e) {
            throw new RuntimeException("Upload failed", e);
        }
    }

    @GET
    @Path("/photos")
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CLIENT"})
    public List<InspectionPhotoResponse> listPhotos(@PathParam("operationId") Long operationId,
                                                     @Context SecurityContext sec) {
        securityHelper.enforceClientAccess(sec, operationService.findById(operationId));
        return inspectionService.getPhotos(operationId).stream()
                .map(InspectionPhotoResponse::from)
                .toList();
    }

    @GET
    @Path("/photos/{photoId}/download")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CLIENT"})
    public Response downloadPhoto(@PathParam("operationId") Long operationId,
                                   @PathParam("photoId") Long photoId,
                                   @Context SecurityContext sec) {
        securityHelper.enforceClientAccess(sec, operationService.findById(operationId));
        var photos = inspectionService.getPhotos(operationId);
        var photo = photos.stream()
                .filter(p -> p.id.equals(photoId))
                .findFirst()
                .orElseThrow(() -> new jakarta.ws.rs.NotFoundException("Inspection photo not found"));

        var path = storageService.resolve(photo.filePath);
        try {
            return Response.ok(Files.newInputStream(path))
                    .header("Content-Disposition", "attachment; filename=\"" + photo.originalName + "\"")
                    .header("Content-Type", photo.mimeType)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Download failed", e);
        }
    }

    // ── Expense endpoints ────────────────────────────────────────────────

    @POST
    @Path("/expenses")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed({"ADMIN", "AGENT"})
    public Response addExpense(@PathParam("operationId") Long operationId,
                               @Valid CreateExpenseRequest request,
                               @Context SecurityContext sec) {
        var expense = inspectionService.addExpense(operationId, request, sec.getUserPrincipal().getName());
        return Response.status(Response.Status.CREATED)
                .entity(InspectionExpenseResponse.from(expense))
                .build();
    }

    @GET
    @Path("/expenses")
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING"})
    public ExpenseSummaryResponse listExpenses(@PathParam("operationId") Long operationId) {
        var expenses = inspectionService.getExpenses(operationId).stream()
                .map(InspectionExpenseResponse::from)
                .toList();
        var total = inspectionService.getExpensesTotal(operationId);
        return new ExpenseSummaryResponse(expenses, total);
    }

    @PUT
    @Path("/expenses/{expenseId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed({"ADMIN", "AGENT"})
    public InspectionExpenseResponse updateExpense(@PathParam("operationId") Long operationId,
                                                    @PathParam("expenseId") Long expenseId,
                                                    @Valid CreateExpenseRequest request,
                                                    @Context SecurityContext sec) {
        var expense = inspectionService.updateExpense(operationId, expenseId, request, sec.getUserPrincipal().getName());
        return InspectionExpenseResponse.from(expense);
    }

    @DELETE
    @Path("/expenses/{expenseId}")
    @RolesAllowed({"ADMIN", "AGENT"})
    public Response deleteExpense(@PathParam("operationId") Long operationId,
                                   @PathParam("expenseId") Long expenseId,
                                   @Context SecurityContext sec) {
        inspectionService.deleteExpense(operationId, expenseId, sec.getUserPrincipal().getName());
        return Response.noContent().build();
    }
}
