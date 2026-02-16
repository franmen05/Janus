package com.janus.shared.infrastructure;

import com.janus.client.domain.model.Client;
import com.janus.client.domain.repository.ClientRepository;
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

    @Transactional
    void onStart(@Observes StartupEvent event) {
        if (userRepository.count() == 0) {
            LOG.info("Seeding initial data...");
            seedClients();
            seedUsers();
            LOG.info("Data seeding complete.");
        }
    }

    private void seedClients() {
        var client1 = new Client();
        client1.name = "Demo Import Corp";
        client1.taxId = "RTN-0801-1990-00001";
        client1.email = "info@demoimport.com";
        client1.phone = "+504-2222-3333";
        client1.address = "San Pedro Sula, Honduras";
        clientRepository.persist(client1);

        var client2 = new Client();
        client2.name = "Global Trade S.A.";
        client2.taxId = "RTN-0501-2005-00042";
        client2.email = "contact@globaltrade.hn";
        client2.phone = "+504-2555-6666";
        client2.address = "Tegucigalpa, Honduras";
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
