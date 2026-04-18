package com.janus.warehouse.domain.repository;

import com.janus.warehouse.domain.model.Warehouse;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class WarehouseRepository implements PanacheRepository<Warehouse> {

    public Optional<Warehouse> findByCode(String code) {
        return find("code", code).firstResultOptional();
    }

    public List<Warehouse> findAllOrdered() {
        return list("ORDER BY secuencia ASC NULLS LAST, name ASC");
    }

    public List<Warehouse> findAllActive() {
        return list("active = true ORDER BY secuencia ASC NULLS LAST, name ASC");
    }

    public List<Warehouse> findPaginated(String search, boolean includeInactive, int page, int size) {
        boolean hasSearch = search != null && !search.isBlank();
        boolean activeOnly = !includeInactive;

        if (hasSearch && activeOnly) {
            var pattern = "%" + search.toLowerCase() + "%";
            return find("active = true AND (LOWER(name) LIKE ?1 OR LOWER(code) LIKE ?1) ORDER BY secuencia ASC NULLS LAST, name ASC", pattern)
                    .page(Page.of(page, size)).list();
        } else if (hasSearch) {
            var pattern = "%" + search.toLowerCase() + "%";
            return find("LOWER(name) LIKE ?1 OR LOWER(code) LIKE ?1 ORDER BY secuencia ASC NULLS LAST, name ASC", pattern)
                    .page(Page.of(page, size)).list();
        } else if (activeOnly) {
            return find("active = true ORDER BY secuencia ASC NULLS LAST, name ASC")
                    .page(Page.of(page, size)).list();
        } else {
            return findAll().page(Page.of(page, size)).list();
        }
    }

    public long countFiltered(String search, boolean includeInactive) {
        boolean hasSearch = search != null && !search.isBlank();
        boolean activeOnly = !includeInactive;

        if (hasSearch && activeOnly) {
            var pattern = "%" + search.toLowerCase() + "%";
            return count("active = true AND (LOWER(name) LIKE ?1 OR LOWER(code) LIKE ?1)", pattern);
        } else if (hasSearch) {
            var pattern = "%" + search.toLowerCase() + "%";
            return count("LOWER(name) LIKE ?1 OR LOWER(code) LIKE ?1", pattern);
        } else if (activeOnly) {
            return count("active = true");
        } else {
            return count();
        }
    }
}
