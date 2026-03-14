package com.janus.document.api;

import com.janus.document.api.dto.DocumentTypeConfigRequest;
import com.janus.document.api.dto.DocumentTypeConfigResponse;
import com.janus.document.domain.repository.DocumentTypeConfigRepository;
import com.janus.shared.infrastructure.exception.NotFoundException;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/api/document-types")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DocumentTypeConfigResource {

    @Inject
    DocumentTypeConfigRepository documentTypeConfigRepository;

    @GET
    @RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CLIENT"})
    public List<DocumentTypeConfigResponse> list() {
        return documentTypeConfigRepository.listAll().stream()
                .map(config -> new DocumentTypeConfigResponse(config.code, config.allowMultiple))
                .toList();
    }

    @PUT
    @Path("/{code}")
    @RolesAllowed("ADMIN")
    @Transactional
    public DocumentTypeConfigResponse update(@PathParam("code") String code,
                                              DocumentTypeConfigRequest request) {
        var config = documentTypeConfigRepository.findByCode(code)
                .orElseThrow(() -> new NotFoundException("DocumentTypeConfig", code));
        config.allowMultiple = request.allowMultiple();
        return new DocumentTypeConfigResponse(config.code, config.allowMultiple);
    }
}
