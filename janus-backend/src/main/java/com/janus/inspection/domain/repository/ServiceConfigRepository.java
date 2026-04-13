package com.janus.inspection.domain.repository;

import com.janus.inspection.domain.model.ServiceConfig;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ServiceConfigRepository implements PanacheRepository<ServiceConfig> {

    public List<ServiceConfig> findAllOrdered() {
        return list("ORDER BY sortOrder, name");
    }

    public List<ServiceConfig> findActive() {
        return list("active = true ORDER BY sortOrder, name");
    }

    public Optional<ServiceConfig> findByName(String name) {
        return find("name", name).firstResultOptional();
    }
}
