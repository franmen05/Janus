package com.janus.warehouse.bonded.domain.repository;

import com.janus.warehouse.bonded.domain.model.BondedWarehouse;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class BondedWarehouseRepository implements PanacheRepository<BondedWarehouse> {

    public Optional<BondedWarehouse> findByCode(String code) {
        return find("code", code).firstResultOptional();
    }

    public List<BondedWarehouse> findAllOrdered() {
        return list("ORDER BY secuencia ASC NULLS LAST, name ASC");
    }

    public List<BondedWarehouse> findAllActive() {
        return list("active = true ORDER BY secuencia ASC NULLS LAST, name ASC");
    }
}
