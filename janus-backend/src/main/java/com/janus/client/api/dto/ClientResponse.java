package com.janus.client.api.dto;

import com.janus.client.domain.model.Client;
import com.janus.client.domain.model.ClientType;
import java.time.LocalDateTime;

public record ClientResponse(
        Long id,
        String name,
        String taxId,
        String email,
        String phone,
        String address,
        boolean active,
        ClientType clientType,
        LocalDateTime createdAt
) {
    public static ClientResponse from(Client client) {
        return new ClientResponse(
                client.id,
                client.name,
                client.taxId,
                client.email,
                client.phone,
                client.address,
                client.active,
                client.clientType,
                client.createdAt
        );
    }
}
