package com.janus.declaration.domain.service;

import com.janus.declaration.domain.model.Declaration;
import com.janus.declaration.domain.model.TariffLine;
import jakarta.enterprise.context.ApplicationScoped;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@ApplicationScoped
public class PreliquidationService {

    private static final int AMOUNT_SCALE = 2;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    /**
     * Calculates preliquidation (preliminary tax estimation) for a declaration
     * based on its tariff lines and declared values.
     *
     * Per tariff line (using line's totalValue as CIF proportion):
     *   dutyAmount = totalValue * dutyRate
     *   itbisAmount = (totalValue + dutyAmount) * itbisRate
     *   selectiveAmount = totalValue * selectiveRate
     *   surchargeAmount = totalValue * surchargeRate
     *   taxAmount = dutyAmount + itbisAmount + selectiveAmount + surchargeAmount + adminFee
     *
     * Totals: cifValue = fobValue + freightValue + insuranceValue
     *         taxableBase = cifValue
     *         totalTaxes = sum of all line taxAmounts
     */
    public PreliquidationResult calculate(Declaration declaration, List<TariffLine> tariffLines) {
        var fob = declaration.fobValue != null ? declaration.fobValue : BigDecimal.ZERO;
        var freight = declaration.freightValue != null ? declaration.freightValue : BigDecimal.ZERO;
        var insurance = declaration.insuranceValue != null ? declaration.insuranceValue : BigDecimal.ZERO;

        var cifValue = fob.add(freight).add(insurance);
        var taxableBase = cifValue;

        var totalDuty = BigDecimal.ZERO;
        var totalItbis = BigDecimal.ZERO;
        var totalSelective = BigDecimal.ZERO;
        var totalSurcharge = BigDecimal.ZERO;
        var totalAdminFees = BigDecimal.ZERO;
        var totalTaxes = BigDecimal.ZERO;

        for (var line : tariffLines) {
            var lineCif = line.totalValue != null ? line.totalValue : BigDecimal.ZERO;

            var dutyRate = line.dutyRate != null ? line.dutyRate : BigDecimal.ZERO;
            var itbisRate = line.itbisRate != null ? line.itbisRate : BigDecimal.ZERO;
            var selectiveRate = line.selectiveRate != null ? line.selectiveRate : BigDecimal.ZERO;
            var surchargeRate = line.surchargeRate != null ? line.surchargeRate : BigDecimal.ZERO;
            var adminFee = line.adminFee != null ? line.adminFee : BigDecimal.ZERO;

            var dutyAmount = lineCif.multiply(dutyRate).divide(HUNDRED, AMOUNT_SCALE, ROUNDING);
            var itbisAmount = lineCif.add(dutyAmount).multiply(itbisRate).divide(HUNDRED, AMOUNT_SCALE, ROUNDING);
            var selectiveAmount = lineCif.multiply(selectiveRate).divide(HUNDRED, AMOUNT_SCALE, ROUNDING);
            var surchargeAmount = lineCif.multiply(surchargeRate).divide(HUNDRED, AMOUNT_SCALE, ROUNDING);

            line.dutyAmount = dutyAmount;
            line.itbisAmount = itbisAmount;
            line.selectiveAmount = selectiveAmount;
            line.surchargeAmount = surchargeAmount;
            line.taxAmount = dutyAmount.add(itbisAmount).add(selectiveAmount).add(surchargeAmount).add(adminFee)
                    .setScale(AMOUNT_SCALE, ROUNDING);

            totalDuty = totalDuty.add(dutyAmount);
            totalItbis = totalItbis.add(itbisAmount);
            totalSelective = totalSelective.add(selectiveAmount);
            totalSurcharge = totalSurcharge.add(surchargeAmount);
            totalAdminFees = totalAdminFees.add(adminFee);
            totalTaxes = totalTaxes.add(line.taxAmount);
        }

        return new PreliquidationResult(fob, cifValue, taxableBase,
                totalDuty, totalItbis, totalSelective, totalSurcharge, totalAdminFees, totalTaxes);
    }

    public record PreliquidationResult(
            BigDecimal fobValue,
            BigDecimal cifValue,
            BigDecimal taxableBase,
            BigDecimal totalDuty,
            BigDecimal totalItbis,
            BigDecimal totalSelective,
            BigDecimal totalSurcharge,
            BigDecimal totalAdminFees,
            BigDecimal totalTaxes
    ) {}
}
