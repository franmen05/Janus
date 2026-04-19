package com.janus.account.domain.repository;

import com.janus.account.domain.model.Account;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class AccountRepository implements PanacheRepository<Account> {

    public Optional<Account> findByTaxId(String taxId) {
        var normalized = normalizeForQuery(taxId);
        return find("LOWER(TRIM(taxId)) = ?1", normalized).firstResultOptional();
    }

    public Optional<Account> findByTaxIdExcluding(String taxId, Long excludeId) {
        var normalized = normalizeForQuery(taxId);
        return find("LOWER(TRIM(taxId)) = ?1 AND id != ?2", normalized, excludeId)
                .firstResultOptional();
    }

    public Optional<Account> findByNameExcluding(String name, Long excludeId) {
        var normalized = normalizeForQuery(name);
        return find("LOWER(TRIM(name)) = ?1 AND id != ?2", normalized, excludeId)
                .firstResultOptional();
    }

    public Optional<Account> findByAccountCodeExcluding(String code, Long excludeId) {
        var normalized = normalizeForQuery(code);
        return find("LOWER(TRIM(accountCode)) = ?1 AND id != ?2", normalized, excludeId)
                .firstResultOptional();
    }

    private String normalizeForQuery(String value) {
        if (value == null) return null;
        return value.trim().replaceAll("\\s+", " ").toLowerCase();
    }

    public List<Account> findPaginated(String search, int page, int size) {
        if (search != null && !search.isBlank()) {
            var pattern = "%" + search.toLowerCase() + "%";
            return find("LOWER(name) LIKE ?1 OR LOWER(taxId) LIKE ?1 OR LOWER(accountCode) LIKE ?1", pattern)
                    .page(Page.of(page, size))
                    .list();
        }
        return findAll().page(Page.of(page, size)).list();
    }

    public long countFiltered(String search) {
        if (search != null && !search.isBlank()) {
            var pattern = "%" + search.toLowerCase() + "%";
            return count("LOWER(name) LIKE ?1 OR LOWER(taxId) LIKE ?1 OR LOWER(accountCode) LIKE ?1", pattern);
        }
        return count();
    }
}
