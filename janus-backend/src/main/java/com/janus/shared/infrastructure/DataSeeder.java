package com.janus.shared.infrastructure;

import com.janus.client.domain.model.Client;
import com.janus.client.domain.model.ClientType;
import com.janus.client.domain.repository.ClientRepository;
import com.janus.document.domain.model.DocumentType;
import com.janus.document.domain.model.DocumentTypeConfig;
import com.janus.document.domain.repository.DocumentTypeConfigRepository;
import com.janus.exchangerate.domain.model.ExchangeRate;
import com.janus.exchangerate.domain.repository.ExchangeRateRepository;
import com.janus.inspection.domain.model.ExpenseCategoryConfig;
import com.janus.inspection.domain.repository.ExpenseCategoryConfigRepository;
import com.janus.port.domain.model.Port;
import com.janus.port.domain.repository.PortRepository;
import com.janus.compliance.domain.model.ComplianceRuleConfig;
import com.janus.compliance.domain.repository.ComplianceRuleConfigRepository;
import com.janus.user.domain.model.Role;
import com.janus.user.domain.model.User;
import com.janus.user.domain.repository.UserRepository;
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
    ClientRepository clientRepository;

    @Inject
    ComplianceRuleConfigRepository complianceRuleConfigRepository;

    @Inject
    PortRepository portRepository;

    @Inject
    DocumentTypeConfigRepository documentTypeConfigRepository;

    @Inject
    ExchangeRateRepository exchangeRateRepository;

    @Inject
    ExpenseCategoryConfigRepository expenseCategoryConfigRepository;

    @Transactional
    void onStart(@Observes StartupEvent event) {
        if (portRepository.count() == 0) {
            LOG.info("Seeding ports...");
            seedPorts();
            LOG.info("Port seeding complete.");
        }
        if (userRepository.count() == 0) {
            LOG.info("Seeding initial data...");
            seedClients();
            seedUsers();
            LOG.info("Data seeding complete.");
        }
        if (complianceRuleConfigRepository.count() == 0) {
            LOG.info("Seeding compliance rule configs...");
            seedComplianceRuleConfigs();
            LOG.info("Compliance rule config seeding complete.");
        }
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
        if (expenseCategoryConfigRepository.count() == 0) {
            LOG.info("Seeding expense category configs...");
            seedExpenseCategories();
            LOG.info("Expense category config seeding complete.");
        }
    }

    private void seedClients() {
        var client1 = new Client();
        client1.name = "Demo Import Corp";
        client1.taxId = "RTN-0801-1990-00001";
        client1.email = "info@demoimport.com";
        client1.phone = "+504-2222-3333";
        client1.address = "San Pedro Sula, Honduras";
        client1.clientType = ClientType.COMPANY;
        clientRepository.persist(client1);

        var client2 = new Client();
        client2.name = "Global Trade S.A.";
        client2.taxId = "RTN-0501-2005-00042";
        client2.email = "contact@globaltrade.hn";
        client2.phone = "+504-2555-6666";
        client2.address = "Tegucigalpa, Honduras";
        client2.clientType = ClientType.COMPANY;
        clientRepository.persist(client2);
    }

    private void seedUsers() {
        var firstClient = clientRepository.find("ORDER BY id").firstResult();
        Long firstClientId = firstClient != null ? firstClient.id : null;

        createUser("admin", "admin123", "System Administrator", "admin@janus.com", Role.ADMIN, null);
        createUser("agent", "agent123", "Customs Agent", "agent@janus.com", Role.AGENT, null);
        createUser("accounting", "acc123", "Accounting User", "accounting@janus.com", Role.ACCOUNTING, null);
        createUser("client", "client123", "Demo Client User", "client@demo.com", Role.CLIENT, firstClientId);
        createUser("carrier", "carrier123", "Demo Carrier", "carrier@demo.com", Role.CARRIER, null);
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
    }

    private void seedPorts() {
        createPort("SPS", "Puerto Cortés", "Principal puerto de Honduras");
        createPort("TGU", "Toncontín", "Aeropuerto Toncontín, Tegucigalpa");
        createPort("SAP", "Ramón Villeda Morales", "Aeropuerto de San Pedro Sula");
        createPort("LCE", "La Ceiba", "Puerto de La Ceiba");
    }

    private void createPort(String code, String name, String description) {
        var port = new Port();
        port.code = code;
        port.name = name;
        port.description = description;
        portRepository.persist(port);
    }

    private void createConfig(String ruleCode, String paramKey, String paramValue, String description) {
        var config = new ComplianceRuleConfig();
        config.ruleCode = ruleCode;
        config.paramKey = paramKey;
        config.paramValue = paramValue;
        config.description = description;
        complianceRuleConfigRepository.persist(config);
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

    private void seedExpenseCategories() {
        createExpenseCategory("LABOR", "Mano de Obra", "Labor", 1);
        createExpenseCategory("EQUIPMENT", "Equipos", "Equipment", 2);
        createExpenseCategory("TRANSPORT", "Transporte", "Transport", 3);
        createExpenseCategory("SECURITY", "Seguridad", "Security", 4);
        createExpenseCategory("OVERTIME", "Horas Extra", "Overtime", 5);
        createExpenseCategory("STORAGE", "Almacenaje", "Storage", 6);
        createExpenseCategory("DEMURRAGE", "Demora", "Demurrage", 7);
        createExpenseCategory("FREIGHT", "Flete", "Freight", 8);
        createExpenseCategory("LOCAL_CHARGES", "Cargos Locales", "Local Charges", 9);
        createExpenseCategory("OTHER", "Otros", "Other", 10);
    }

    private void createExpenseCategory(String name, String labelEs, String labelEn, int sortOrder) {
        var config = new ExpenseCategoryConfig();
        config.name = name;
        config.labelEs = labelEs;
        config.labelEn = labelEn;
        config.sortOrder = sortOrder;
        expenseCategoryConfigRepository.persist(config);
    }

    private void createUser(String username, String password, String fullName,
                             String email, Role role, Long clientId) {
        var user = new User();
        user.username = username;
        user.password = BcryptUtil.bcryptHash(password);
        user.fullName = fullName;
        user.email = email;
        user.role = role.name();
        user.clientId = clientId;
        userRepository.persist(user);
    }
}
