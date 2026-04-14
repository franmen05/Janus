package com.janus.account.domain.repository;

import com.janus.account.domain.model.AccountContact;
import com.janus.account.domain.model.ContactType;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class AccountContactRepository implements PanacheRepository<AccountContact> {

    public List<AccountContact> findByAccountId(Long accountId) {
        return find("account.id", accountId).list();
    }

    public Optional<AccountContact> findPrimaryByAccountId(Long accountId) {
        return find("account.id = ?1 and contactType = ?2", accountId, ContactType.PRIMARY).firstResultOptional();
    }
}
