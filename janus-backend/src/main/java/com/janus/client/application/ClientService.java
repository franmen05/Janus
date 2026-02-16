package com.janus.client.application;

import com.janus.client.api.dto.CreateClientRequest;
import com.janus.client.domain.model.Client;
import com.janus.client.domain.repository.ClientRepository;
import com.janus.shared.infrastructure.exception.BusinessException;
import com.janus.shared.infrastructure.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class ClientService {

    @Inject
    ClientRepository clientRepository;

    public List<Client> listAll() {
        return clientRepository.listAll();
    }

    public Client findById(Long id) {
        return clientRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Client", id));
    }

    @Transactional
    public Client create(CreateClientRequest request) {
        if (clientRepository.findByTaxId(request.taxId()).isPresent()) {
            throw new BusinessException("Client with tax ID already exists: " + request.taxId());
        }

        var client = new Client();
        client.name = request.name();
        client.taxId = request.taxId();
        client.email = request.email();
        client.phone = request.phone();
        client.address = request.address();
        clientRepository.persist(client);
        return client;
    }

    @Transactional
    public Client update(Long id, CreateClientRequest request) {
        var client = findById(id);
        client.name = request.name();
        client.taxId = request.taxId();
        client.email = request.email();
        client.phone = request.phone();
        client.address = request.address();
        return client;
    }
}
