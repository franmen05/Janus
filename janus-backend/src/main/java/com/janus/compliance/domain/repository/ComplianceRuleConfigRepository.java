package com.janus.compliance.domain.repository;

import com.janus.compliance.domain.model.ComplianceRuleConfig;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ComplianceRuleConfigRepository implements PanacheRepository<ComplianceRuleConfig> {

    public List<ComplianceRuleConfig> findByRuleCode(String ruleCode) {
        return list("ruleCode", ruleCode);
    }

    public Optional<ComplianceRuleConfig> findByRuleCodeAndKey(String ruleCode, String paramKey) {
        return find("ruleCode = ?1 AND paramKey = ?2", ruleCode, paramKey).firstResultOptional();
    }

    public boolean isRuleEnabled(String ruleCode) {
        return find("ruleCode = ?1 AND paramKey = 'enabled'", ruleCode)
                .firstResultOptional()
                .map(c -> Boolean.parseBoolean(c.paramValue))
                .orElse(true);
    }

    public Optional<String> getParamValue(String ruleCode, String paramKey) {
        return findByRuleCodeAndKey(ruleCode, paramKey)
                .map(c -> c.paramValue);
    }
}
