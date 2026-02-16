package com.janus.document.api;

import com.janus.document.api.dto.CompletenessResponse;
import com.janus.document.api.dto.DocumentResponse;
import com.janus.document.api.dto.DocumentVersionResponse;
import com.janus.document.application.DocumentService;
import com.janus.document.domain.model.DocumentType;
import com.janus.document.infrastructure.storage.StorageService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.util.List;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@Path("/api/operations/{operationId}/documents")
@Produces(MediaType.APPLICATION_JSON)
public class DocumentResource {

    @Inject
    DocumentService documentService;

    @Inject
    StorageService storageService;

    @GET
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CLIENT"})
    public List<DocumentResponse> list(@PathParam("operationId") Long operationId) {
        return documentService.findByOperationId(operationId).stream()
                .map(doc -> {
                    var latestVersion = documentService.getLatestVersionOrNull(doc.id);
                    if (latestVersion != null) {
                        return DocumentResponse.from(doc, latestVersion.originalName, latestVersion.fileSize);
                    }
                    return DocumentResponse.from(doc);
                })
                .toList();
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CLIENT"})
    public DocumentResponse getById(@PathParam("id") Long id) {
        return DocumentResponse.from(documentService.findById(id));
    }

    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed({"ADMIN", "AGENT"})
    public Response upload(@PathParam("operationId") Long operationId,
                           @RestForm("file") FileUpload file,
                           @RestForm("documentType") DocumentType documentType,
                           @Context SecurityContext sec) {
        try {
            var inputStream = Files.newInputStream(file.uploadedFile());
            var doc = documentService.upload(
                    operationId,
                    documentType,
                    inputStream,
                    file.fileName(),
                    file.contentType(),
                    Files.size(file.uploadedFile()),
                    sec.getUserPrincipal().getName()
            );
            return Response.status(Response.Status.CREATED)
                    .entity(DocumentResponse.from(doc))
                    .build();
        } catch (IOException e) {
            throw new RuntimeException("Upload failed", e);
        }
    }

    @GET
    @Path("/{id}/download")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CLIENT"})
    public Response downloadLatest(@PathParam("id") Long id) {
        var version = documentService.getLatestVersion(id);
        var path = storageService.resolve(version.filePath);
        try {
            return Response.ok(Files.newInputStream(path))
                    .header("Content-Disposition", "attachment; filename=\"" + version.originalName + "\"")
                    .header("Content-Type", version.mimeType)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Download failed", e);
        }
    }

    @GET
    @Path("/{id}/versions")
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CLIENT"})
    public List<DocumentVersionResponse> getVersions(@PathParam("id") Long id) {
        return documentService.getVersions(id).stream()
                .map(DocumentVersionResponse::from)
                .toList();
    }

    @GET
    @Path("/{id}/versions/{versionNumber}/download")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CLIENT"})
    public Response downloadVersion(@PathParam("id") Long id,
                                     @PathParam("versionNumber") int versionNumber) {
        var version = documentService.getVersion(id, versionNumber);
        var path = storageService.resolve(version.filePath);
        try {
            return Response.ok(Files.newInputStream(path))
                    .header("Content-Disposition", "attachment; filename=\"" + version.originalName + "\"")
                    .header("Content-Type", version.mimeType)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Download failed", e);
        }
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed({"ADMIN", "AGENT"})
    public Response softDelete(@PathParam("id") Long id) {
        documentService.softDelete(id);
        return Response.noContent().build();
    }

    @GET
    @Path("/completeness")
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CLIENT"})
    public CompletenessResponse getCompleteness(@PathParam("operationId") Long operationId) {
        return CompletenessResponse.from(documentService.getCompleteness(operationId));
    }
}
