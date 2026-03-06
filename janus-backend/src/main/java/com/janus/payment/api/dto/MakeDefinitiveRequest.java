package com.janus.payment.api.dto;

import jakarta.validation.constraints.NotNull;

public record MakeDefinitiveRequest(@NotNull String dgaPaymentCode) {}
