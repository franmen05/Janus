package com.janus.port.domain.repository;

import com.janus.port.domain.model.Port;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class PortRepository implements PanacheRepository<Port> {

    public Optional<Port> findByCode(String code) {
        return find("code", code).firstResultOptional();
    }

    public List<String> findExistingCodes(List<String> codes) {
        if (codes == null || codes.isEmpty()) {
            return List.of();
        }
        return find("code in ?1", codes)
                .stream()
                .map(p -> p.code)
                .toList();
    }

    public List<Port> findByOriginPort(boolean value) {
        return list("originPort", value);
    }

    public List<Port> findByArrivalPort(boolean value) {
        return list("arrivalPort", value);
    }
}
