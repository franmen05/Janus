package com.janus.payment.domain.model;

public enum LiquidationStatus {
    PRELIMINARY,   // Auto-generated, can be recalculated
    APPROVED,      // Approved by supervisor/gerente
    DEFINITIVE,    // Final, ready for payment
    PAID           // Payment registered
}
