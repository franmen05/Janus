package com.janus.port.api.dto;

import com.janus.port.domain.model.Port;
import java.time.LocalDateTime;

public record PortResponse(
        Long id,
        String code,
        String name,
        String description,
        String address,
        LocalDateTime createdAt
) {
    public static PortResponse from(Port port) {
        return new PortResponse(
                port.id,
                port.code,
                port.name,
                port.description,
                port.address,
                port.createdAt
        );
    }
}
