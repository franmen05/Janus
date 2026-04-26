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

    public List<Account> findPaginated(String search, int page, int size, boolean activeOnly) {
        if (search != null && !search.isBlank()) {
            var pattern = "%" + search.toLowerCase() + "%";
            if (activeOnly) {
                return find("(LOWER(name) LIKE ?1 OR LOWER(taxId) LIKE ?1 OR LOWER(accountCode) LIKE ?1) AND active = true", pattern)
                        .page(Page.of(page, size))
                        .list();
            }
            return find("LOWER(name) LIKE ?1 OR LOWER(taxId) LIKE ?1 OR LOWER(accountCode) LIKE ?1", pattern)
                    .page(Page.of(page, size))
                    .list();
        }
        if (activeOnly) {
            return find("active = true").page(Page.of(page, size)).list();
        }
        return findAll().page(Page.of(page, size)).list();
    }

    public long findMaxSequenceForPrefix(String prefix, String separator) {
        if (prefix == null) prefix = "";
        if (separator == null) separator = "";
        var fullPrefix = prefix + separator;
        var pattern = fullPrefix + "%";
        List<Account> matching = find("accountCode LIKE ?1", pattern).list();
        List<String> codes = matching.stream().map(a -> a.accountCode).toList();
        long max = 0L;
        int prefixLen = fullPrefix.length();
        for (String code : codes) {
            if (code == null || code.length() <= prefixLen) continue;
            String suffix = code.substring(prefixLen);
            if (suffix.isEmpty()) continue;
            boolean allDigits = true;
            for (int i = 0; i < suffix.length(); i++) {
                if (!Character.isDigit(suffix.charAt(i))) {
                    allDigits = false;
                    break;
                }
            }
            if (!allDigits) continue;
            try {
                long n = Long.parseLong(suffix);
                if (n > max) max = n;
            } catch (NumberFormatException ignored) {
                // skip
            }
        }
        return max;
    }

    public long countFiltered(String search, boolean activeOnly) {
        if (search != null && !search.isBlank()) {
            var pattern = "%" + search.toLowerCase() + "%";
            if (activeOnly) {
                return count("(LOWER(name) LIKE ?1 OR LOWER(taxId) LIKE ?1 OR LOWER(accountCode) LIKE ?1) AND active = true", pattern);
            }
            return count("LOWER(name) LIKE ?1 OR LOWER(taxId) LIKE ?1 OR LOWER(accountCode) LIKE ?1", pattern);
        }
        if (activeOnly) {
            return count("active = true");
        }
        return count();
    }
}
