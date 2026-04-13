package com.janus.deposito.domain.repository;

import com.janus.deposito.domain.model.Deposito;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;

@ApplicationScoped
public class DepositoRepository implements PanacheRepository<Deposito> {

    public Optional<Deposito> findByCode(String code) {
        return find("code", code).firstResultOptional();
    }
}
