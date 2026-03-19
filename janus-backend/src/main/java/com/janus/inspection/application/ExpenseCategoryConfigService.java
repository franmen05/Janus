package com.janus.inspection.application;

import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import com.janus.inspection.api.dto.CreateExpenseCategoryRequest;
import com.janus.inspection.api.dto.UpdateExpenseCategoryRequest;
import com.janus.inspection.domain.model.ExpenseCategoryConfig;
import com.janus.inspection.domain.repository.ExpenseCategoryConfigRepository;
import com.janus.inspection.domain.repository.InspectionExpenseRepository;
import com.janus.shared.infrastructure.exception.BusinessException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class ExpenseCategoryConfigService {

    @Inject
    ExpenseCategoryConfigRepository repository;

    @Inject
    InspectionExpenseRepository expenseRepository;

    @Inject
    Event<AuditEvent> auditEvent;

    public List<ExpenseCategoryConfig> listAll() {
        return repository.findAllOrdered();
    }

    public List<ExpenseCategoryConfig> listActive() {
        return repository.findActive();
    }

    @Transactional
    public ExpenseCategoryConfig create(CreateExpenseCategoryRequest request, String username) {
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

        auditEvent.fire(new AuditEvent(username, AuditAction.CREATE, "ExpenseCategoryConfig",
                config.id, null, null, null, null));

        return config;
    }

    @Transactional
    public ExpenseCategoryConfig update(Long id, UpdateExpenseCategoryRequest request, String username) {
        var config = repository.findByIdOptional(id)
                .orElseThrow(() -> new jakarta.ws.rs.NotFoundException("Expense category not found"));

        config.labelEs = request.labelEs();
        config.labelEn = request.labelEn();
        config.sortOrder = request.sortOrder();

        auditEvent.fire(new AuditEvent(username, AuditAction.UPDATE, "ExpenseCategoryConfig",
                config.id, null, null, null, null));

        return config;
    }

    @Transactional
    public ExpenseCategoryConfig toggleActive(Long id, String username) {
        var config = repository.findByIdOptional(id)
                .orElseThrow(() -> new jakarta.ws.rs.NotFoundException("Expense category not found"));

        config.active = !config.active;

        auditEvent.fire(new AuditEvent(username, AuditAction.UPDATE, "ExpenseCategoryConfig",
                config.id, null, null, null,
                "Toggled active to " + config.active));

        return config;
    }

    @Transactional
    public void delete(Long id, String username) {
        var config = repository.findByIdOptional(id)
                .orElseThrow(() -> new jakarta.ws.rs.NotFoundException("Expense category not found"));

        long usageCount = expenseRepository.count("category = ?1 and active = true", config.name);
        if (usageCount > 0) {
            throw new BusinessException("CATEGORY_IN_USE",
                    "Cannot delete category '" + config.name + "' because it is referenced by " + usageCount + " expense(s)");
        }

        var entityId = config.id;
        repository.delete(config);

        auditEvent.fire(new AuditEvent(username, AuditAction.DELETE, "ExpenseCategoryConfig",
                entityId, null, null, null, null));
    }
}
