package com.janus.account.api;

import com.janus.account.api.dto.AccountResponse;
import com.janus.account.api.dto.CreateAccountRequest;
import com.janus.account.application.AccountService;
import com.janus.shared.api.dto.PageResponse;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
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

@Path("/api/accounts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN", "AGENT"})
public class AccountResource {

    @Inject
    AccountService accountService;

    @GET
    public PageResponse<AccountResponse> list(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("10") int size,
            @QueryParam("search") String search) {
        return accountService.listPaginated(search, page, size);
    }

    @GET
    @Path("/{id}")
    public AccountResponse getById(@PathParam("id") Long id) {
        return AccountResponse.from(accountService.findById(id));
    }

    @POST
    public Response create(@Valid CreateAccountRequest request, @Context SecurityContext sec) {
        var account = accountService.create(request, sec.getUserPrincipal().getName());
        return Response.status(Response.Status.CREATED)
                .entity(AccountResponse.from(account))
                .build();
    }

    @PUT
    @Path("/{id}")
    public AccountResponse update(@PathParam("id") Long id, @Valid CreateAccountRequest request, @Context SecurityContext sec) {
        return AccountResponse.from(accountService.update(id, request, sec.getUserPrincipal().getName()));
    }
}
