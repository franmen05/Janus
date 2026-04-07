package com.janus.apikey.api;

import com.janus.apikey.api.dto.ApiKeyCreatedResponse;
import com.janus.apikey.api.dto.ApiKeyResponse;
import com.janus.apikey.api.dto.CreateApiKeyRequest;
import com.janus.apikey.application.ApiKeyService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import java.util.List;

@Path("/api/api-keys")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("ADMIN")
public class ApiKeyResource {

    @Inject
    ApiKeyService apiKeyService;

    @GET
    public List<ApiKeyResponse> list() {
        return apiKeyService.listAll().stream()
                .map(ApiKeyResponse::from)
                .toList();
    }

    @POST
    public Response create(@Valid CreateApiKeyRequest request, @Context SecurityContext sec) {
        var result = apiKeyService.create(
                request.name(),
                request.expiresAt(),
                sec.getUserPrincipal().getName()
        );
        return Response.status(Response.Status.CREATED)
                .entity(ApiKeyCreatedResponse.from(result.apiKey(), result.plaintextKey()))
                .build();
    }

    @DELETE
    @Path("/{id}")
    public Response revoke(@PathParam("id") Long id) {
        apiKeyService.revoke(id);
        return Response.noContent().build();
    }
}
