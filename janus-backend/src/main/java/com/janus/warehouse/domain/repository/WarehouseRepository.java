package com.janus.warehouse.domain.repository;

import com.janus.warehouse.domain.model.Warehouse;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
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
}
