package com.janus.port.domain.repository;

import com.janus.port.domain.model.Port;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;

@ApplicationScoped
public class PortRepository implements PanacheRepository<Port> {

    public Optional<Port> findByCode(String code) {
        return find("code", code).firstResultOptional();
    }
}
