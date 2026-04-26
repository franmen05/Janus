package com.janus.account.api;

import com.janus.account.api.dto.AccountResponse;
import com.janus.account.api.dto.CreateAccountRequest;
import com.janus.account.api.dto.SetAccountActiveRequest;
import com.janus.account.application.AccountCsvService;
import com.janus.account.application.AccountService;
import com.janus.shared.api.dto.CsvImportResponse;
import com.janus.shared.api.dto.PageResponse;
import com.janus.shared.infrastructure.exception.BusinessException;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
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
import java.io.IOException;
import java.nio.file.Files;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@Path("/api/accounts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN", "AGENT"})
public class AccountResource {

    @Inject
    AccountService accountService;

    @Inject
    AccountCsvService accountCsvService;

    @GET
    public PageResponse<AccountResponse> list(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("10") int size,
            @QueryParam("search") String search,
            @QueryParam("activeOnly") @DefaultValue("false") boolean activeOnly) {
        return accountService.listPaginated(search, page, size, activeOnly);
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

    @PATCH
    @Path("/{id}/active")
    @RolesAllowed("ADMIN")
    public AccountResponse setActive(@PathParam("id") Long id, @Valid SetAccountActiveRequest request, @Context SecurityContext sec) {
        return AccountResponse.from(accountService.setActive(id, request.active(), sec.getUserPrincipal().getName()));
    }

    @POST
    @Path("/{id}/partners/{associatedId}")
    @Consumes(MediaType.WILDCARD)
    public AccountResponse addPartner(@PathParam("id") Long id, @PathParam("associatedId") Long associatedId, @Context SecurityContext sec) {
        return AccountResponse.from(accountService.addPartner(id, associatedId, sec.getUserPrincipal().getName()));
    }

    @DELETE
    @Path("/{id}/partners/{associatedId}")
    public Response removePartner(@PathParam("id") Long id, @PathParam("associatedId") Long associatedId, @Context SecurityContext sec) {
        accountService.removePartner(id, associatedId, sec.getUserPrincipal().getName());
        return Response.noContent().build();
    }

    @GET
    @Path("/export")
    @Produces("text/csv")
    public Response exportCsv() {
        String csv = accountCsvService.exportCsv();
        return Response.ok(csv)
                .type("text/csv; charset=UTF-8")
                .header("Content-Disposition", "attachment; filename=\"accounts.csv\"")
                .build();
    }

    @POST
    @Path("/import")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public CsvImportResponse importCsv(@RestForm("file") FileUpload file, @Context SecurityContext sec) {
        if (file == null) throw new BusinessException("MISSING_FILE", "CSV file is required");
        try (var stream = Files.newInputStream(file.uploadedFile())) {
            return accountCsvService.importCsv(stream, sec.getUserPrincipal().getName());
        } catch (IOException e) {
            throw new BusinessException("CSV_READ_ERROR", "Failed to read uploaded file");
        }
    }
}
