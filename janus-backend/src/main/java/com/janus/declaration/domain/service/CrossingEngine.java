package com.janus.declaration.domain.service;

import com.janus.declaration.domain.model.CrossingDiscrepancy;
import com.janus.declaration.domain.model.CrossingResult;
import com.janus.declaration.domain.model.Declaration;
import com.janus.declaration.domain.model.DiscrepancyField;
import com.janus.declaration.domain.model.TariffLine;
import jakarta.enterprise.context.ApplicationScoped;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@ApplicationScoped
public class CrossingEngine {

    private static final BigDecimal TOLERANCE = new BigDecimal("0.01");

    public List<CrossingDiscrepancy> compare(CrossingResult crossingResult,
                                              Declaration preliminary, List<TariffLine> prelimLines,
                                              Declaration finalDecl, List<TariffLine> finalLines) {
        var discrepancies = new ArrayList<CrossingDiscrepancy>();

        compareHeaderValue(crossingResult, discrepancies, DiscrepancyField.FOB_VALUE,
                preliminary.fobValue, finalDecl.fobValue);
        compareHeaderValue(crossingResult, discrepancies, DiscrepancyField.CIF_VALUE,
                preliminary.cifValue, finalDecl.cifValue);
        compareHeaderValue(crossingResult, discrepancies, DiscrepancyField.TAXABLE_BASE,
                preliminary.taxableBase, finalDecl.taxableBase);
        compareHeaderValue(crossingResult, discrepancies, DiscrepancyField.TOTAL_TAXES,
                preliminary.totalTaxes, finalDecl.totalTaxes);
        compareHeaderValue(crossingResult, discrepancies, DiscrepancyField.FREIGHT_VALUE,
                preliminary.freightValue, finalDecl.freightValue);
        compareHeaderValue(crossingResult, discrepancies, DiscrepancyField.INSURANCE_VALUE,
                preliminary.insuranceValue, finalDecl.insuranceValue);

        compareTariffLines(crossingResult, discrepancies, prelimLines, finalLines);

        return discrepancies;
    }

    private void compareHeaderValue(CrossingResult crossingResult, List<CrossingDiscrepancy> discrepancies,
                                     DiscrepancyField field, BigDecimal prelimValue, BigDecimal finalValue) {
        if (prelimValue == null && finalValue == null) return;
        if (prelimValue == null || finalValue == null || !valuesMatch(prelimValue, finalValue)) {
            var d = new CrossingDiscrepancy();
            d.crossingResult = crossingResult;
            d.field = field;
            d.preliminaryValue = prelimValue != null ? prelimValue.toPlainString() : "null";
            d.finalValue = finalValue != null ? finalValue.toPlainString() : "null";
            d.difference = calculateDifference(prelimValue, finalValue);
            d.description = "Header value mismatch for " + field;
            discrepancies.add(d);
        }
    }

    private void compareTariffLines(CrossingResult crossingResult, List<CrossingDiscrepancy> discrepancies,
                                     List<TariffLine> prelimLines, List<TariffLine> finalLines) {
        Map<Integer, TariffLine> prelimByLine = prelimLines.stream()
                .collect(Collectors.toMap(l -> l.lineNumber, l -> l));
        Map<Integer, TariffLine> finalByLine = finalLines.stream()
                .collect(Collectors.toMap(l -> l.lineNumber, l -> l));

        // Check for lines in preliminary missing from final
        for (var entry : prelimByLine.entrySet()) {
            if (!finalByLine.containsKey(entry.getKey())) {
                var d = new CrossingDiscrepancy();
                d.crossingResult = crossingResult;
                d.field = DiscrepancyField.TARIFF_LINE_MISSING;
                d.tariffLineNumber = entry.getKey();
                d.preliminaryValue = entry.getValue().tariffCode;
                d.finalValue = "MISSING";
                d.description = "Tariff line " + entry.getKey() + " exists in preliminary but missing in final";
                discrepancies.add(d);
            }
        }

        // Check for lines in final missing from preliminary
        for (var entry : finalByLine.entrySet()) {
            if (!prelimByLine.containsKey(entry.getKey())) {
                var d = new CrossingDiscrepancy();
                d.crossingResult = crossingResult;
                d.field = DiscrepancyField.TARIFF_LINE_MISSING;
                d.tariffLineNumber = entry.getKey();
                d.preliminaryValue = "MISSING";
                d.finalValue = entry.getValue().tariffCode;
                d.description = "Tariff line " + entry.getKey() + " exists in final but missing in preliminary";
                discrepancies.add(d);
            }
        }

        // Compare matching lines
        for (var entry : prelimByLine.entrySet()) {
            var finalLine = finalByLine.get(entry.getKey());
            if (finalLine != null) {
                var prelimLine = entry.getValue();
                compareTariffLineValues(crossingResult, discrepancies, prelimLine, finalLine);
            }
        }
    }

    private void compareTariffLineValues(CrossingResult crossingResult, List<CrossingDiscrepancy> discrepancies,
                                          TariffLine prelim, TariffLine finalLine) {
        if (!valuesMatch(prelim.quantity, finalLine.quantity)) {
            var d = new CrossingDiscrepancy();
            d.crossingResult = crossingResult;
            d.field = DiscrepancyField.TARIFF_LINE_QUANTITY;
            d.tariffLineNumber = prelim.lineNumber;
            d.preliminaryValue = prelim.quantity != null ? prelim.quantity.toPlainString() : "null";
            d.finalValue = finalLine.quantity != null ? finalLine.quantity.toPlainString() : "null";
            d.difference = calculateDifference(prelim.quantity, finalLine.quantity);
            d.description = "Quantity mismatch on line " + prelim.lineNumber;
            discrepancies.add(d);
        }

        if (!valuesMatch(prelim.totalValue, finalLine.totalValue)) {
            var d = new CrossingDiscrepancy();
            d.crossingResult = crossingResult;
            d.field = DiscrepancyField.TARIFF_LINE_VALUE;
            d.tariffLineNumber = prelim.lineNumber;
            d.preliminaryValue = prelim.totalValue != null ? prelim.totalValue.toPlainString() : "null";
            d.finalValue = finalLine.totalValue != null ? finalLine.totalValue.toPlainString() : "null";
            d.difference = calculateDifference(prelim.totalValue, finalLine.totalValue);
            d.description = "Total value mismatch on line " + prelim.lineNumber;
            discrepancies.add(d);
        }

        if (!valuesMatch(prelim.taxAmount, finalLine.taxAmount)) {
            var d = new CrossingDiscrepancy();
            d.crossingResult = crossingResult;
            d.field = DiscrepancyField.TARIFF_LINE_TAX;
            d.tariffLineNumber = prelim.lineNumber;
            d.preliminaryValue = prelim.taxAmount != null ? prelim.taxAmount.toPlainString() : "null";
            d.finalValue = finalLine.taxAmount != null ? finalLine.taxAmount.toPlainString() : "null";
            d.difference = calculateDifference(prelim.taxAmount, finalLine.taxAmount);
            d.description = "Tax amount mismatch on line " + prelim.lineNumber;
            discrepancies.add(d);
        }
    }

    private boolean valuesMatch(BigDecimal a, BigDecimal b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.subtract(b).abs().compareTo(TOLERANCE) <= 0;
    }

    private BigDecimal calculateDifference(BigDecimal a, BigDecimal b) {
        if (a == null) a = BigDecimal.ZERO;
        if (b == null) b = BigDecimal.ZERO;
        return b.subtract(a);
    }
}
