package com.janus.exchangerate.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.exchangerate.domain.model.ExchangeRate;
import com.janus.exchangerate.domain.repository.ExchangeRateRepository;
import com.janus.exchangerate.infrastructure.ExternalRateService;
import com.janus.shared.infrastructure.exception.BusinessException;
import com.janus.shared.infrastructure.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class ExchangeRateService {

    @Inject
    ExchangeRateRepository exchangeRateRepository;

    @Inject
    ExternalRateService externalRateService;

    @Inject
    Event<AuditEvent> auditEvent;

    public List<ExchangeRate> listAll() {
        return exchangeRateRepository.listAllOrdered();
    }

    public ExchangeRate findById(Long id) {
        return exchangeRateRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("ExchangeRate", id));
    }

    public ExchangeRate getActiveRate() {
        return exchangeRateRepository.findActive("USD", "DOP")
                .orElseThrow(() -> new NotFoundException("ExchangeRate", "active USD/DOP"));
    }

    public ExchangeRate getRateForDate(LocalDate date) {
        // 1. Try exact date
        var exact = exchangeRateRepository.findByDate("USD", "DOP", date);
        if (exact.isPresent()) {
            return exact.get();
        }

        // 2. Try closest rate before that date
        var closest = exchangeRateRepository.findClosestRate("USD", "DOP", date);
        if (closest.isPresent()) {
            return closest.get();
        }

        // 3. Fall back to current active rate
        return exchangeRateRepository.findActive("USD", "DOP")
                .orElseThrow(() -> new NotFoundException("ExchangeRate", "NO_EXCHANGE_RATE"));
    }

    @Transactional
    public ExchangeRate create(BigDecimal rate, LocalDate effectiveDate, String source, String username) {
        if (effectiveDate.isBefore(LocalDate.now())) {
            throw new BusinessException("EXCHANGE_RATE_PAST_DATE",
                    "Cannot create exchange rate with a past date: " + effectiveDate);
        }

        var existing = exchangeRateRepository.findByDate("USD", "DOP", effectiveDate);
        if (existing.isPresent()) {
            var exchangeRate = existing.get();
            var previousRate = exchangeRate.rate;
            exchangeRate.rate = rate;
            exchangeRate.source = source;
            deactivatePreviousActive("USD", "DOP");
            exchangeRate.active = true;

            auditEvent.fire(new AuditEvent(
                    username, AuditAction.UPDATE, "ExchangeRate", exchangeRate.id, null,
                    null, null, "Exchange rate updated for " + effectiveDate + ": " + previousRate + " → " + rate + " DOP (source: " + source + ")"
            ));

            return exchangeRate;
        }

        deactivatePreviousActive("USD", "DOP");

        var exchangeRate = new ExchangeRate();
        exchangeRate.rate = rate;
        exchangeRate.effectiveDate = effectiveDate;
        exchangeRate.source = source;
        exchangeRate.active = true;
        exchangeRateRepository.persist(exchangeRate);

        auditEvent.fire(new AuditEvent(
                username, AuditAction.CREATE, "ExchangeRate", exchangeRate.id, null,
                null, null, "Exchange rate created: 1 USD = " + rate + " DOP (effective " + effectiveDate + ", source: " + source + ")"
        ));

        return exchangeRate;
    }

    @Transactional
    public ExchangeRate update(Long id, BigDecimal rate, LocalDate effectiveDate, String username) {
        var exchangeRate = findById(id);
        exchangeRate.rate = rate;
        exchangeRate.effectiveDate = effectiveDate;

        auditEvent.fire(new AuditEvent(
                username, AuditAction.UPDATE, "ExchangeRate", id, null,
                null, null, "Exchange rate updated: 1 USD = " + rate + " DOP (effective " + effectiveDate + ")"
        ));

        return exchangeRate;
    }

    @Transactional
    public ExchangeRate fetchExternalRate(String username) {
        var rate = externalRateService.fetchDopRate();
        var exchangeRate = create(rate, LocalDate.now(), "AUTOMATIC", username);

        auditEvent.fire(new AuditEvent(
                username, AuditAction.CREATE, "ExchangeRate", exchangeRate.id, null,
                null, null, "Exchange rate fetched from external API: 1 USD = " + rate + " DOP"
        ));

        return exchangeRate;
    }

    private void deactivatePreviousActive(String sourceCurrency, String targetCurrency) {
        exchangeRateRepository.findActive(sourceCurrency, targetCurrency)
                .ifPresent(existing -> existing.active = false);
    }
}
