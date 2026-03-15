package com.janus.inspection.domain.repository;

import com.janus.inspection.domain.model.ExpenseCategoryConfig;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ExpenseCategoryConfigRepository implements PanacheRepository<ExpenseCategoryConfig> {

    public List<ExpenseCategoryConfig> findAllOrdered() {
        return list("ORDER BY sortOrder, name");
    }

    public List<ExpenseCategoryConfig> findActive() {
        return list("active = true ORDER BY sortOrder, name");
    }

    public Optional<ExpenseCategoryConfig> findByName(String name) {
        return find("name", name).firstResultOptional();
    }
}
