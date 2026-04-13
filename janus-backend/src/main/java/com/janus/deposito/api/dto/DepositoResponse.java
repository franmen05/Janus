package com.janus.deposito.api.dto;

import com.janus.deposito.domain.model.Deposito;
import java.time.LocalDateTime;

public record DepositoResponse(
        Long id,
        String code,
        String name,
        String description,
        LocalDateTime createdAt
) {
    public static DepositoResponse from(Deposito deposito) {
        return new DepositoResponse(
                deposito.id,
                deposito.code,
                deposito.name,
                deposito.description,
                deposito.createdAt
        );
    }
}
