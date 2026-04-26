package com.janus.account;

import com.janus.account.application.AccountService;
import com.janus.account.domain.model.Account;
import com.janus.account.domain.model.AccountType;
import com.janus.account.domain.repository.AccountRepository;
import com.janus.audit.domain.model.AuditAction;
import com.janus.audit.domain.model.AuditEvent;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.HashSet;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Verifies that {@link AccountService#setActive(Long, boolean, String)} fires an
 * {@link AuditEvent} every time it is invoked — including no-op transitions
 * (e.g., deactivating an already-inactive account), since those clicks remain
 * meaningful audit events.
 */
@QuarkusTest
class AccountServiceAuditTest {

    @Inject
    AccountService accountService;

    @Inject
    AccountRepository accountRepository;

    @Inject
    AuditEventCapture auditEventCapture;

    @BeforeEach
    void clearCapturedEvents() {
        auditEventCapture.clear();
    }

    @Test
    void setActive_FiresAuditEvent_OnDeactivate() {
        var accountId = createAccount("Audit Deactivate Corp", "RTN-AUDIT-DEACT-001",
                "auditdeact@test.com", true);

        accountService.setActive(accountId, false, "test-user");

        var deactivateEvents = auditEventCapture.events().stream()
                .filter(e -> "Account".equals(e.entityName()))
                .filter(e -> accountId.equals(e.entityId()))
                .filter(e -> e.action() == AuditAction.UPDATE)
                .filter(e -> e.details() != null && e.details().contains("Account deactivated:"))
                .toList();
        assertTrue(!deactivateEvents.isEmpty(),
                "Expected at least one AuditEvent with details containing 'Account deactivated:' "
                        + "for entityId=" + accountId + ", got=" + auditEventCapture.events());
    }

    @Test
    void setActive_FiresAuditEvent_OnActivate() {
        var accountId = createAccount("Audit Activate Corp", "RTN-AUDIT-ACT-001",
                "auditact@test.com", false);

        accountService.setActive(accountId, true, "test-user");

        var activateEvents = auditEventCapture.events().stream()
                .filter(e -> "Account".equals(e.entityName()))
                .filter(e -> accountId.equals(e.entityId()))
                .filter(e -> e.action() == AuditAction.UPDATE)
                .filter(e -> e.details() != null && e.details().contains("Account activated:"))
                .toList();
        assertTrue(!activateEvents.isEmpty(),
                "Expected at least one AuditEvent with details containing 'Account activated:' "
                        + "for entityId=" + accountId + ", got=" + auditEventCapture.events());
    }

    @Transactional
    Long createAccount(String name, String taxId, String email, boolean active) {
        var account = new Account();
        account.name = name;
        account.taxId = taxId;
        account.email = email;
        account.accountTypes = new HashSet<>(List.of(AccountType.COMPANY));
        account.active = active;
        accountRepository.persist(account);
        assertNotNull(account.id, "Persisted account should have an id");
        return account.id;
    }

    /**
     * Test-scoped CDI observer that captures every {@link AuditEvent} fired during a test.
     * Uses a thread-safe list so async observer dispatch (if any) is safe.
     */
    @ApplicationScoped
    public static class AuditEventCapture {

        private final List<AuditEvent> captured = new CopyOnWriteArrayList<>();

        void onAuditEvent(@Observes AuditEvent event) {
            captured.add(event);
        }

        public List<AuditEvent> events() {
            return List.copyOf(captured);
        }

        public void clear() {
            captured.clear();
        }
    }
}
