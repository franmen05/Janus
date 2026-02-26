package com.janus.compliance.application;

import com.janus.compliance.domain.model.ComplianceRuleConfig;
import com.janus.compliance.domain.repository.ComplianceRuleConfigRepository;
import com.janus.shared.infrastructure.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class ComplianceRuleConfigService {

    @Inject
    ComplianceRuleConfigRepository repository;

    public List<ComplianceRuleConfig> listAll() {
        return repository.listAll();
    }

    public List<ComplianceRuleConfig> findByRuleCode(String ruleCode) {
        return repository.findByRuleCode(ruleCode);
    }

    @Transactional
    public ComplianceRuleConfig create(ComplianceRuleConfig entity) {
        repository.persist(entity);
        return entity;
    }

    @Transactional
    public ComplianceRuleConfig update(Long id, ComplianceRuleConfig update) {
        var config = repository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("ComplianceRuleConfig", id));
        config.paramValue = update.paramValue;
        config.enabled = update.enabled;
        if (update.description != null) {
            config.description = update.description;
        }
        return config;
    }

    @Transactional
    public void delete(Long id) {
        var config = repository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("ComplianceRuleConfig", id));
        repository.delete(config);
    }
}
