package com.janus.account.domain.repository;

import com.janus.account.domain.model.AccountCodeConfig;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class AccountCodeConfigRepository implements PanacheRepositoryBase<AccountCodeConfig, Long> {

    public static final Long SINGLETON_ID = 1L;

    public AccountCodeConfig getSingleton() {
        var existing = findById(SINGLETON_ID);
        if (existing != null) {
            return existing;
        }
        var config = new AccountCodeConfig();
        config.id = SINGLETON_ID;
        config.prefix = "ACC";
        config.separator = "-";
        config.paddingLength = 5;
        config.enabled = true;
        persist(config);
        return config;
    }
}
