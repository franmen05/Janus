package com.janus.shared.infrastructure;

import com.janus.customer.domain.model.Customer;
import com.janus.customer.domain.model.CustomerType;
import com.janus.customer.domain.repository.CustomerRepository;
import com.janus.document.domain.model.DocumentType;
import com.janus.document.domain.model.DocumentTypeConfig;
import com.janus.document.domain.repository.DocumentTypeConfigRepository;
import com.janus.exchangerate.domain.model.ExchangeRate;
import com.janus.exchangerate.domain.repository.ExchangeRateRepository;
import com.janus.inspection.domain.model.ServiceConfig;
import com.janus.inspection.domain.repository.ServiceConfigRepository;
import com.janus.deposito.domain.model.Deposito;
import com.janus.deposito.domain.repository.DepositoRepository;
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
    CustomerRepository customerRepository;

    @Inject
    ComplianceRuleConfigRepository complianceRuleConfigRepository;

    @Inject
    PortRepository portRepository;

    @Inject
    DepositoRepository depositoRepository;

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
            seedCustomers();
            seedUsers();
            LOG.info("Data seeding complete.");
        }
        if (depositoRepository.count() == 0) {
            LOG.info("Seeding depositos...");
            seedDepositos();
            LOG.info("Deposito seeding complete.");
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

    private void seedCustomers() {
        var customer1 = new Customer();
        customer1.name = "Demo Import Corp";
        customer1.taxId = "RTN-0801-1990-00001";
        customer1.email = "info@demoimport.com";
        customer1.phone = "+504-2222-3333";
        customer1.address = "San Pedro Sula, Honduras";
        customer1.customerType = CustomerType.COMPANY;
        customerRepository.persist(customer1);

        var customer2 = new Customer();
        customer2.name = "Global Trade S.A.";
        customer2.taxId = "RTN-0501-2005-00042";
        customer2.email = "contact@globaltrade.hn";
        customer2.phone = "+504-2555-6666";
        customer2.address = "Tegucigalpa, Honduras";
        customer2.customerType = CustomerType.COMPANY;
        customerRepository.persist(customer2);
    }

    private void seedUsers() {
        var firstCustomer = customerRepository.find("ORDER BY id").firstResult();
        Long firstCustomerId = firstCustomer != null ? firstCustomer.id : null;

        createUser("admin", "admin123", "System Administrator", "admin@janus.com", Set.of(Role.ADMIN), null);
        createUser("supervisor", "super123", "Supervisor Agent", "supervisor@janus.com", Set.of(Role.AGENT, Role.SUPERVISOR), null);
        createUser("agent", "agent123", "Customs Agent", "agent@janus.com", Set.of(Role.AGENT), null);
        createUser("accounting", "acc123", "Accounting User", "accounting@janus.com", Set.of(Role.ACCOUNTING), null);
        createUser("client", "client123", "Demo Client User", "client@demo.com", Set.of(Role.CUSTOMER), firstCustomerId);
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

    private void seedDepositos() {
        var dep1 = new Deposito();
        dep1.code = "DEP-001";
        dep1.name = "Depósito Central";
        dep1.description = "Depósito principal de carga general";
        depositoRepository.persist(dep1);

        var dep2 = new Deposito();
        dep2.code = "DEP-002";
        dep2.name = "Depósito Zona Libre";
        dep2.description = "Depósito en zona franca";
        depositoRepository.persist(dep2);

        var dep3 = new Deposito();
        dep3.code = "DEP-003";
        dep3.name = "Depósito Refrigerado";
        dep3.description = "Depósito para carga refrigerada y perecederos";
        depositoRepository.persist(dep3);
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
                             String email, Set<Role> roles, Long customerId) {
        var user = new User();
        user.username = username;
        user.password = BcryptUtil.bcryptHash(password);
        user.fullName = fullName;
        user.email = email;
        user.roles = roles.stream().map(Role::name).collect(Collectors.toSet());
        user.customerId = customerId;
        userRepository.persist(user);
    }
}
