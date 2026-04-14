package com.janus.account.api;

import com.janus.account.api.dto.AccountContactResponse;
import com.janus.account.api.dto.CreateAccountContactRequest;
import com.janus.account.application.AccountContactService;
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
import java.util.List;

@Path("/api/accounts/{accountId}/contacts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN", "AGENT"})
public class AccountContactResource {

    @Inject
    AccountContactService accountContactService;

    @GET
    public List<AccountContactResponse> list(@PathParam("accountId") Long accountId) {
        return accountContactService.listByAccountId(accountId).stream()
                .map(AccountContactResponse::from)
                .toList();
    }

    @POST
    public Response create(@PathParam("accountId") Long accountId,
                           @Valid CreateAccountContactRequest request,
                           @Context SecurityContext sec) {
        var contact = accountContactService.create(accountId, request, sec.getUserPrincipal().getName());
        return Response.status(Response.Status.CREATED)
                .entity(AccountContactResponse.from(contact))
                .build();
    }

    @PUT
    @Path("/{contactId}")
    public AccountContactResponse update(@PathParam("accountId") Long accountId,
                                          @PathParam("contactId") Long contactId,
                                          @Valid CreateAccountContactRequest request,
                                          @Context SecurityContext sec) {
        return AccountContactResponse.from(
                accountContactService.update(contactId, request, sec.getUserPrincipal().getName()));
    }

    @DELETE
    @Path("/{contactId}")
    public Response delete(@PathParam("accountId") Long accountId,
                           @PathParam("contactId") Long contactId,
                           @Context SecurityContext sec) {
        accountContactService.delete(contactId, sec.getUserPrincipal().getName());
        return Response.noContent().build();
    }
}
