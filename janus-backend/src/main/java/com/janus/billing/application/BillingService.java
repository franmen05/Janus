package com.janus.billing.application;

import com.janus.billing.api.dto.InvoiceSummary;
import com.janus.billing.infrastructure.BillFlowClient;
import com.janus.billing.infrastructure.dto.*;
import com.janus.account.domain.model.Account;
import com.janus.inspection.domain.model.BillingStatus;
import com.janus.inspection.domain.model.InspectionExpense;
import com.janus.shared.infrastructure.exception.BusinessException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class BillingService {

    private static final Logger LOG = Logger.getLogger(BillingService.class);

    @Inject
    BillFlowClient billFlowClient;

    @ConfigProperty(name = "janus.billing.default-ncf-type", defaultValue = "E31")
    String defaultNcfType;

    public InvoiceSummary createInvoice(Account account, List<InspectionExpense> charges) {
        if (account.taxId == null || account.taxId.isBlank()) {
            throw new BusinessException("MISSING_TAX_ID", "Account must have a tax ID for billing");
        }

        // 1. Create or find client in BillFlow
        var clientResponse = billFlowClient.createOrFindClient(account);
        LOG.infof("BillFlow client %s (id=%d, created=%s)",
                clientResponse.idDocumentNumber(), clientResponse.id(), clientResponse.created());

        // 2. Build invoice lines from charges
        var lines = charges.stream()
                .map(c -> new BillFlowInvoiceLineRequest(
                        c.description != null && !c.description.isBlank() ? c.description : c.category,
                        c.quantity,
                        c.rate != null ? c.rate : c.amount,
                        "EXEMPT"
                ))
                .toList();

        // 3. Create invoice in BillFlow
        var invoiceRequest = new BillFlowInvoiceRequest(
                account.taxId,
                defaultNcfType,
                LocalDate.now().plusDays(30).toString(),
                true,
                lines
        );

        var invoiceResponse = billFlowClient.createInvoice(invoiceRequest);
        LOG.infof("BillFlow invoice created: %s (NCF: %s, total: %s)",
                invoiceResponse.invoiceCode(), invoiceResponse.ncfNumber(), invoiceResponse.totalAmount());

        // 4. Stamp each charge with invoice data and update billing status
        for (var charge : charges) {
            charge.billFlowInvoiceId = invoiceResponse.id();
            charge.ncfNumber = invoiceResponse.ncfNumber();
            charge.billingStatus = BillingStatus.SENT_TO_BILLING;
        }

        return new InvoiceSummary(
                invoiceResponse.invoiceCode(),
                invoiceResponse.ncfNumber(),
                invoiceResponse.totalAmount(),
                charges.size()
        );
    }
}
