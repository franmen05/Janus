package com.janus.shared.infrastructure.security;

import com.janus.apikey.application.ApiKeyService;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import java.util.Optional;

@Provider
@Priority(Priorities.AUTHENTICATION)
public class ExternalApiKeyFilter implements ContainerRequestFilter {

    public static final String API_KEY_HEADER = "X-API-Key";
    public static final String EXTERNAL_USER_PROPERTY = "external.username";

    @Inject
    ApiKeyService apiKeyService;

    @ConfigProperty(name = "janus.external.api-key")
    Optional<String> legacyApiKey;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        String path = requestContext.getUriInfo().getPath();

        if (!path.startsWith("/api/external/") && !path.startsWith("api/external/")) {
            return;
        }

        String apiKey = requestContext.getHeaderString(API_KEY_HEADER);

        if (apiKey == null || apiKey.isBlank()) {
            requestContext.abortWith(
                Response.status(Response.Status.UNAUTHORIZED)
                    .type(MediaType.APPLICATION_JSON_TYPE)
                    .entity(java.util.Map.of("error", "Missing API key"))
                    .build()
            );
            return;
        }

        // Try DB-managed keys first
        var validKey = apiKeyService.validate(apiKey);
        if (validKey.isPresent()) {
            requestContext.setProperty(EXTERNAL_USER_PROPERTY, "apikey:" + validKey.get().name);
            return;
        }

        // Fallback to legacy config key
        if (legacyApiKey.isPresent() && legacyApiKey.get().equals(apiKey)) {
            requestContext.setProperty(EXTERNAL_USER_PROPERTY, "external-billing-system");
            return;
        }

        requestContext.abortWith(
            Response.status(Response.Status.UNAUTHORIZED)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(java.util.Map.of("error", "Invalid API key"))
                .build()
        );
    }
}
