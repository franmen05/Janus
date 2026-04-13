package com.janus.exchangerate.domain.repository;

import com.janus.exchangerate.domain.model.ExchangeRate;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ExchangeRateRepository implements PanacheRepository<ExchangeRate> {

    public Optional<ExchangeRate> findActive(String sourceCurrency, String targetCurrency) {
        return find("sourceCurrency = ?1 and targetCurrency = ?2 and active = true order by effectiveDate desc",
                sourceCurrency, targetCurrency).firstResultOptional();
    }

    public Optional<ExchangeRate> findByDate(String sourceCurrency, String targetCurrency, LocalDate date) {
        return find("sourceCurrency = ?1 and targetCurrency = ?2 and effectiveDate = ?3",
                sourceCurrency, targetCurrency, date).firstResultOptional();
    }

    public Optional<ExchangeRate> findClosestRate(String sourceCurrency, String targetCurrency, LocalDate date) {
        return find("sourceCurrency = ?1 and targetCurrency = ?2 and effectiveDate <= ?3 order by effectiveDate desc",
                sourceCurrency, targetCurrency, date).firstResultOptional();
    }

    public List<ExchangeRate> listAllOrdered() {
        return list("order by effectiveDate desc, createdAt desc");
    }

    public List<ExchangeRate> listPaginated(int page, int size) {
        return find("order by effectiveDate desc, createdAt desc")
                .page(Page.of(page, size))
                .list();
    }

    public long countAll() {
        return count();
    }
}
