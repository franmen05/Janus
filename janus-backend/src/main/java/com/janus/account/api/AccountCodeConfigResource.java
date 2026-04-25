package com.janus.account.api;

import com.janus.account.api.dto.AccountCodeConfigDto;
import com.janus.account.application.AccountCodeConfigService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/accounts/code-config")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AccountCodeConfigResource {

    @Inject
    AccountCodeConfigService service;

    @GET
    @RolesAllowed({"ADMIN", "AGENT"})
    public AccountCodeConfigDto get() {
        return service.get();
    }

    @PUT
    @RolesAllowed("ADMIN")
    public AccountCodeConfigDto update(AccountCodeConfigDto request) {
        return service.update(request);
    }
}
