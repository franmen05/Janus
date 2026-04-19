package com.janus.shared.infrastructure;

import com.janus.account.domain.model.Account;
import com.janus.account.domain.model.AccountType;
import com.janus.account.domain.repository.AccountRepository;
import com.janus.document.domain.model.DocumentType;
import com.janus.document.domain.model.DocumentTypeConfig;
import com.janus.document.domain.repository.DocumentTypeConfigRepository;
import com.janus.exchangerate.domain.model.ExchangeRate;
import com.janus.exchangerate.domain.repository.ExchangeRateRepository;
import com.janus.inspection.domain.model.ServiceConfig;
import com.janus.inspection.domain.repository.ServiceConfigRepository;
import com.janus.warehouse.bonded.domain.repository.BondedWarehouseRepository;
import com.janus.port.domain.model.Port;
import com.janus.port.domain.repository.PortRepository;
import com.janus.compliance.domain.model.ComplianceRuleConfig;
import com.janus.compliance.domain.repository.ComplianceRuleConfigRepository;
import com.janus.user.domain.model.Role;
import com.janus.user.domain.model.User;
import com.janus.user.domain.repository.UserRepository;
import java.util.Set;
import java.util.stream.Collectors;
import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

@ApplicationScoped
public class DataSeeder {

    private static final Logger LOG = Logger.getLogger(DataSeeder.class);

    @Inject
    UserRepository userRepository;

    @Inject
    AccountRepository accountRepository;

    @Inject
    ComplianceRuleConfigRepository complianceRuleConfigRepository;

    @Inject
    PortRepository portRepository;

    @Inject
    BondedWarehouseRepository warehouseRepository;

    @Inject
    com.janus.warehouse.bonded.application.BondedWarehouseCsvService warehouseCsvService;

    @Inject
    DocumentTypeConfigRepository documentTypeConfigRepository;

    @Inject
    ExchangeRateRepository exchangeRateRepository;

    @Inject
    ServiceConfigRepository serviceConfigRepository;

    @Transactional
    void onStart(@Observes StartupEvent event) {
        if (portRepository.count() == 0) {
            LOG.info("Seeding ports...");
            seedPorts();
            LOG.info("Port seeding complete.");
        }
        if (userRepository.count() == 0) {
            LOG.info("Seeding initial data...");
            seedAccounts();
            seedUsers();
            LOG.info("Data seeding complete.");
        }
        if (warehouseRepository.count() == 0) {
            LOG.info("Seeding warehouses...");
            seedWarehouses();
            LOG.info("Warehouse seeding complete.");
        }
        if (complianceRuleConfigRepository.count() == 0) {
            LOG.info("Seeding compliance rule configs...");
            seedComplianceRuleConfigs();
            LOG.info("Compliance rule config seeding complete.");
        }
        ensureComplianceRuleExists("LIQUIDATION_APPROVAL_REQUIRED", "enabled", "true",
                "Requires ADMIN approval before liquidation can be made definitive");
        if (documentTypeConfigRepository.count() == 0) {
            LOG.info("Seeding document type configs...");
            seedDocumentTypeConfigs();
            LOG.info("Document type config seeding complete.");
        }
        if (exchangeRateRepository.count() == 0) {
            LOG.info("Seeding exchange rates...");
            seedExchangeRates();
            LOG.info("Exchange rate seeding complete.");
        }
        if (serviceConfigRepository.count() == 0) {
            LOG.info("Seeding service configs...");
            seedServices();
            LOG.info("Service config seeding complete.");
        }
    }

    private void seedAccounts() {
        var account1 = new Account();
        account1.name = "Demo Import Corp";
        account1.taxId = "RTN-0801-1990-00001";
        account1.email = "info@demoimport.com";
        account1.phone = "+504-2222-3333";
        account1.address = "San Pedro Sula, Honduras";
        account1.accountTypes = Set.of(AccountType.COMPANY);
        accountRepository.persist(account1);

        var account2 = new Account();
        account2.name = "Global Trade S.A.";
        account2.taxId = "RTN-0501-2005-00042";
        account2.email = "contact@globaltrade.hn";
        account2.phone = "+504-2555-6666";
        account2.address = "Tegucigalpa, Honduras";
        account2.accountTypes = Set.of(AccountType.COMPANY);
        accountRepository.persist(account2);
    }

    private void seedUsers() {
        var firstAccount = accountRepository.find("ORDER BY id").firstResult();
        Long firstAccountId = firstAccount != null ? firstAccount.id : null;

        createUser("admin", "admin123", "System Administrator", "admin@janus.com", Set.of(Role.ADMIN), null);
        createUser("supervisor", "super123", "Supervisor Agent", "supervisor@janus.com", Set.of(Role.AGENT, Role.SUPERVISOR), null);
        createUser("agent", "agent123", "Customs Agent", "agent@janus.com", Set.of(Role.AGENT), null);
        createUser("accounting", "acc123", "Accounting User", "accounting@janus.com", Set.of(Role.ACCOUNTING), null);
        createUser("client", "client123", "Demo Client User", "client@demo.com", Set.of(Role.CUSTOMER), firstAccountId);
        createUser("carrier", "carrier123", "Demo Carrier", "carrier@demo.com", Set.of(Role.CARRIER), null);
    }

    private void seedComplianceRuleConfigs() {
        createConfig("COMPLETENESS_REQUIRED", "enabled", "true", "Enable completeness check rule");
        createConfig("COMPLETENESS_REQUIRED", "mandatory_documents_MARITIME", "BL,COMMERCIAL_INVOICE,PACKING_LIST,CERTIFICATE",
                "Mandatory documents for MARITIME transport");
        createConfig("COMPLETENESS_REQUIRED", "mandatory_documents_AIR", "BL,COMMERCIAL_INVOICE,PACKING_LIST",
                "Mandatory documents for AIR transport");
        createConfig("COMMERCIAL_INVOICE_REQUIRED", "enabled", "true", "Enable commercial invoice validation rule");
        createConfig("HIGH_VALUE_ADDITIONAL_DOC", "enabled", "true", "Enable high value additional document rule");
        createConfig("PHYSICAL_INSPECTION_GATT", "enabled", "true", "Enable physical inspection GATT rule");
        createConfig("BL_VERIFIED_FOR_VALUATION", "enabled", "true", "Enable BL verification for valuation rule");
        createConfig("CROSSING_RESOLVED", "enabled", "true", "Enable crossing resolved rule");
        createConfig("INTERNAL_REVIEW_COMPLETE", "enabled", "true", "Enable internal review completeness check");
        createConfig("PRELIQUIDATION_APPROVED", "enabled", "true", "Enable preliquidation approval gate");
        createConfig("INSPECTION_TYPE_REQUIRED", "enabled", "true", "Enable inspection type required rule");
        createConfig("EXTERNAL_PERMITS_CLEARED", "enabled", "true", "Enable external permits cleared rule");
        createConfig("LOCAL_CHARGES_VALIDATED", "enabled", "true", "Enable local charges validated rule");
        createConfig("RECEPTION_RECEIPT_REQUIRED", "enabled", "true", "Enable reception receipt required rule for closing operations");
        createConfig("LIQUIDATION_PAID_FOR_CLOSING", "enabled", "true", "Enable liquidation paid check before closing operation");
        createConfig("LIQUIDATION_APPROVAL_REQUIRED", "enabled", "true", "Requires ADMIN approval before liquidation can be made definitive");
    }

    private void seedPorts() {
        createPort("HNPCR", "Puerto Cortés", "Principal puerto comercial de Honduras", "HN", true, true);
        createPort("HNLCE", "La Ceiba", "Puerto de La Ceiba", "HN", true, true);
        createPort("HNRTB", "Roatán", "Puerto de Roatán, Islas de la Bahía", "HN", false, true);
        createPort("HNTEA", "Tela", "Puerto de Tela", "HN", false, true);
    }

    private void createPort(String code, String name, String description, String country, boolean originPort, boolean arrivalPort) {
        var port = new Port();
        port.code = code;
        port.name = name;
        port.description = description;
        port.country = country;
        port.originPort = originPort;
        port.arrivalPort = arrivalPort;
        portRepository.persist(port);
    }

    private void seedWarehouses() {
        warehouseCsvService.seedFromClasspath("warehouses-catalog.csv", "system");
    }

    private void createConfig(String ruleCode, String paramKey, String paramValue, String description) {
        var config = new ComplianceRuleConfig();
        config.ruleCode = ruleCode;
        config.paramKey = paramKey;
        config.paramValue = paramValue;
        config.description = description;
        complianceRuleConfigRepository.persist(config);
    }

    private void ensureComplianceRuleExists(String ruleCode, String paramKey, String paramValue, String description) {
        if (complianceRuleConfigRepository.findByRuleCodeAndKey(ruleCode, paramKey).isEmpty()) {
            LOG.infof("Seeding missing compliance rule: %s/%s", ruleCode, paramKey);
            createConfig(ruleCode, paramKey, paramValue, description);
        }
    }

    private void seedDocumentTypeConfigs() {
        for (var type : DocumentType.values()) {
            if (documentTypeConfigRepository.findByCode(type.name()).isEmpty()) {
                var config = new DocumentTypeConfig();
                config.code = type.name();
                config.allowMultiple = false;
                documentTypeConfigRepository.persist(config);
            }
        }
    }

    private void seedExchangeRates() {
        var rate = new ExchangeRate();
        rate.sourceCurrency = "USD";
        rate.targetCurrency = "DOP";
        rate.rate = new java.math.BigDecimal("58.5000");
        rate.effectiveDate = java.time.LocalDate.of(2026, 3, 14);
        rate.source = "MANUAL";
        rate.active = true;
        exchangeRateRepository.persist(rate);
    }

    private void seedServices() {
        createService("LABOR", "Mano de Obra", "Labor", 1);
        createService("EQUIPMENT", "Equipos", "Equipment", 2);
        createService("TRANSPORT", "Transporte", "Transport", 3);
        createService("SECURITY", "Seguridad", "Security", 4);
        createService("OVERTIME", "Horas Extra", "Overtime", 5);
        createService("STORAGE", "Almacenaje", "Storage", 6);
        createService("DEMURRAGE", "Demora", "Demurrage", 7);
        createService("FREIGHT", "Flete", "Freight", 8);
        createService("LOCAL_CHARGES", "Cargos Locales", "Local Charges", 9);
        createService("OTHER", "Otros", "Other", 10);
    }

    private void createService(String name, String labelEs, String labelEn, int sortOrder) {
        var config = new ServiceConfig();
        config.name = name;
        config.labelEs = labelEs;
        config.labelEn = labelEn;
        config.sortOrder = sortOrder;
        serviceConfigRepository.persist(config);
    }

    private void createUser(String username, String password, String fullName,
                             String email, Set<Role> roles, Long accountId) {
        var user = new User();
        user.username = username;
        user.password = BcryptUtil.bcryptHash(password);
        user.fullName = fullName;
        user.email = email;
        user.roles = roles.stream().map(Role::name).collect(Collectors.toSet());
        user.accountId = accountId;
        userRepository.persist(user);
    }
}
