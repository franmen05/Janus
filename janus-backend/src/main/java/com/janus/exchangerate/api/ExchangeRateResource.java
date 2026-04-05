package com.janus.exchangerate.api;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.exchangerate.api.dto.AutoFetchToggleRequest;
import com.janus.exchangerate.api.dto.CreateExchangeRateRequest;
import com.janus.exchangerate.api.dto.ExchangeRateResponse;
import com.janus.exchangerate.application.ExchangeRateService;
import com.janus.exchangerate.infrastructure.ExchangeRateScheduler;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
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
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Path("/api/exchange-rates")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ExchangeRateResource {

    @Inject
    ExchangeRateService exchangeRateService;

    @Inject
    ExchangeRateScheduler exchangeRateScheduler;

    @Inject
    Event<AuditEvent> auditEvent;

    @GET
    @RolesAllowed("ADMIN")
    public List<ExchangeRateResponse> list() {
        return exchangeRateService.listAll().stream()
                .map(ExchangeRateResponse::from)
                .toList();
    }

    @GET
    @Path("/current")
    @RolesAllowed({"ADMIN", "SUPERVISOR", "AGENT", "ACCOUNTING"})
    public ExchangeRateResponse getCurrent() {
        return ExchangeRateResponse.from(exchangeRateService.getActiveRate());
    }

    @GET
    @Path("/for-date")
    @RolesAllowed({"ADMIN", "SUPERVISOR", "AGENT"})
    public ExchangeRateResponse getForDate(@QueryParam("date") LocalDate date) {
        return ExchangeRateResponse.from(exchangeRateService.getRateForDate(date));
    }

    @GET
    @Path("/{id}")
    @RolesAllowed("ADMIN")
    public ExchangeRateResponse getById(@PathParam("id") Long id) {
        return ExchangeRateResponse.from(exchangeRateService.findById(id));
    }

    @POST
    @RolesAllowed("ADMIN")
    public Response create(@Valid CreateExchangeRateRequest request, @Context SecurityContext sec) {
        var exchangeRate = exchangeRateService.create(request.rate(), request.effectiveDate(), "MANUAL",
                sec.getUserPrincipal().getName());
        return Response.status(Response.Status.CREATED)
                .entity(ExchangeRateResponse.from(exchangeRate))
                .build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("ADMIN")
    public ExchangeRateResponse update(@PathParam("id") Long id, @Valid CreateExchangeRateRequest request,
                                       @Context SecurityContext sec) {
        return ExchangeRateResponse.from(exchangeRateService.update(id, request.rate(), request.effectiveDate(),
                sec.getUserPrincipal().getName()));
    }

    @POST
    @Path("/fetch")
    @RolesAllowed("ADMIN")
    public ExchangeRateResponse fetchExternal(@Context SecurityContext sec) {
        return ExchangeRateResponse.from(exchangeRateService.fetchExternalRate(sec.getUserPrincipal().getName()));
    }

    @GET
    @Path("/auto-fetch/status")
    @RolesAllowed("ADMIN")
    public Map<String, Object> getAutoFetchStatus() {
        return Map.of(
                "enabled", exchangeRateScheduler.isEnabled(),
                "hour", exchangeRateScheduler.getScheduledHour(),
                "minute", exchangeRateScheduler.getScheduledMinute()
        );
    }

    @PUT
    @Path("/auto-fetch/toggle")
    @RolesAllowed("ADMIN")
    public Map<String, Object> toggleAutoFetch(AutoFetchToggleRequest request, @Context SecurityContext sec) {
        exchangeRateScheduler.setEnabled(request.enabled());

        if (request.hour() != null && request.minute() != null) {
            exchangeRateScheduler.setScheduledTime(request.hour(), request.minute());
        }

        var username = sec.getUserPrincipal().getName();
        var timeStr = String.format("%02d:%02d", exchangeRateScheduler.getScheduledHour(), exchangeRateScheduler.getScheduledMinute());
        auditEvent.fire(new AuditEvent(
                username, AuditAction.UPDATE, "ExchangeRateScheduler", null, null,
                null, null, "Auto-fetch exchange rate " + (request.enabled() ? "enabled" : "disabled") + " (scheduled at " + timeStr + ")"
        ));

        return Map.of(
                "enabled", exchangeRateScheduler.isEnabled(),
                "hour", exchangeRateScheduler.getScheduledHour(),
                "minute", exchangeRateScheduler.getScheduledMinute()
        );
    }
}
