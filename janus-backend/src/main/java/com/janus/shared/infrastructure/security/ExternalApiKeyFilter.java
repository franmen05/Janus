package com.janus.shared.infrastructure.security;

import jakarta.annotation.Priority;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@Provider
@Priority(Priorities.AUTHENTICATION)
public class ExternalApiKeyFilter implements ContainerRequestFilter {

    public static final String API_KEY_HEADER = "X-API-Key";
    public static final String EXTERNAL_USER_PROPERTY = "external.username";
    public static final String EXTERNAL_USERNAME = "external-billing-system";

    @ConfigProperty(name = "janus.external.api-key")
    String expectedApiKey;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        String path = requestContext.getUriInfo().getPath();

        // Only apply to /api/external/* routes
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

        if (!expectedApiKey.equals(apiKey)) {
            requestContext.abortWith(
                Response.status(Response.Status.UNAUTHORIZED)
                    .type(MediaType.APPLICATION_JSON_TYPE)
                    .entity(java.util.Map.of("error", "Invalid API key"))
                    .build()
            );
            return;
        }

        // Store the identity for downstream use
        requestContext.setProperty(EXTERNAL_USER_PROPERTY, EXTERNAL_USERNAME);
    }
}
