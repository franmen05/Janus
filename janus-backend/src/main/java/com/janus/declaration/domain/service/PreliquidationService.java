package com.janus.declaration.domain.service;

import com.janus.declaration.domain.model.Declaration;
import com.janus.declaration.domain.model.TariffLine;
import jakarta.enterprise.context.ApplicationScoped;
import java.math.BigDecimal;
import java.util.List;

@ApplicationScoped
public class PreliquidationService {

    /**
     * Calculates preliquidation (preliminary tax estimation) for a declaration
     * based on its tariff lines and declared values.
     *
     * Per tariff line: taxAmount = totalValue * taxRate
     * Totals: totalTaxes = sum of all taxAmounts
     *         cifValue = fobValue + freightValue + insuranceValue
     *         taxableBase = cifValue
     */
    public PreliquidationResult calculate(Declaration declaration, List<TariffLine> tariffLines) {
        var fob = declaration.fobValue != null ? declaration.fobValue : BigDecimal.ZERO;
        var freight = declaration.freightValue != null ? declaration.freightValue : BigDecimal.ZERO;
        var insurance = declaration.insuranceValue != null ? declaration.insuranceValue : BigDecimal.ZERO;

        var cifValue = fob.add(freight).add(insurance);
        var taxableBase = cifValue;

        var totalTaxes = BigDecimal.ZERO;
        for (var line : tariffLines) {
            var lineTax = line.totalValue != null && line.taxRate != null
                    ? line.totalValue.multiply(line.taxRate)
                    : BigDecimal.ZERO;
            totalTaxes = totalTaxes.add(lineTax);
        }

        return new PreliquidationResult(fob, cifValue, taxableBase, totalTaxes);
    }

    public record PreliquidationResult(
            BigDecimal fobValue,
            BigDecimal cifValue,
            BigDecimal taxableBase,
            BigDecimal totalTaxes
    ) {}
}
