package com.janus.inspection.application;

import com.janus.inspection.api.dto.CreateExpenseCategoryRequest;
import com.janus.inspection.api.dto.UpdateExpenseCategoryRequest;
import com.janus.inspection.domain.model.ExpenseCategoryConfig;
import com.janus.inspection.domain.repository.ExpenseCategoryConfigRepository;
import com.janus.inspection.domain.repository.InspectionExpenseRepository;
import com.janus.shared.infrastructure.exception.BusinessException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class ExpenseCategoryConfigService {

    @Inject
    ExpenseCategoryConfigRepository repository;

    @Inject
    InspectionExpenseRepository expenseRepository;

    public List<ExpenseCategoryConfig> listAll() {
        return repository.findAllOrdered();
    }

    public List<ExpenseCategoryConfig> listActive() {
        return repository.findActive();
    }

    @Transactional
    public ExpenseCategoryConfig create(CreateExpenseCategoryRequest request) {
        var name = request.name().toUpperCase().trim();

        if (repository.findByName(name).isPresent()) {
            throw new BusinessException("CATEGORY_ALREADY_EXISTS",
                    "Expense category with name '" + name + "' already exists");
        }

        var config = new ExpenseCategoryConfig();
        config.name = name;
        config.labelEs = request.labelEs();
        config.labelEn = request.labelEn();
        repository.persist(config);
        return config;
    }

    @Transactional
    public ExpenseCategoryConfig update(Long id, UpdateExpenseCategoryRequest request) {
        var config = repository.findByIdOptional(id)
                .orElseThrow(() -> new jakarta.ws.rs.NotFoundException("Expense category not found"));

        config.labelEs = request.labelEs();
        config.labelEn = request.labelEn();
        config.sortOrder = request.sortOrder();
        return config;
    }

    @Transactional
    public ExpenseCategoryConfig toggleActive(Long id) {
        var config = repository.findByIdOptional(id)
                .orElseThrow(() -> new jakarta.ws.rs.NotFoundException("Expense category not found"));

        config.active = !config.active;
        return config;
    }

    @Transactional
    public void delete(Long id) {
        var config = repository.findByIdOptional(id)
                .orElseThrow(() -> new jakarta.ws.rs.NotFoundException("Expense category not found"));

        long usageCount = expenseRepository.count("category = ?1 and active = true", config.name);
        if (usageCount > 0) {
            throw new BusinessException("CATEGORY_IN_USE",
                    "Cannot delete category '" + config.name + "' because it is referenced by " + usageCount + " expense(s)");
        }

        repository.delete(config);
    }
}
