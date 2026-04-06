package com.janus.billing.infrastructure;

import com.janus.billing.infrastructure.dto.*;
import com.janus.customer.domain.model.Customer;
import com.janus.shared.infrastructure.exception.BusinessException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.json.Json;
import jakarta.json.JsonObject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import java.io.StringReader;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@ApplicationScoped
public class BillFlowClient {

    private static final Logger LOG = Logger.getLogger(BillFlowClient.class);

    @ConfigProperty(name = "janus.billing.billflow-url", defaultValue = "http://localhost:8081")
    String baseUrl;

    @ConfigProperty(name = "janus.billing.billflow-api-key")
    String apiKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public BillFlowClientResponse createOrFindClient(Customer customer) {
        String firstName = customer.name;
        String lastName = "";
        if (customer.name != null && customer.name.contains(" ")) {
            int idx = customer.name.indexOf(' ');
            firstName = customer.name.substring(0, idx);
            lastName = customer.name.substring(idx + 1);
        }

        var jsonBody = Json.createObjectBuilder()
                .add("firstName", firstName != null ? firstName : "")
                .add("lastName", lastName)
                .add("idDocumentType", customer.documentType != null ? customer.documentType.name() : "RNC")
                .add("idDocumentNumber", customer.taxId)
                .add("email", customer.email != null ? customer.email : "")
                .add("phone", customer.phone != null ? customer.phone : "")
                .add("address", customer.address != null ? customer.address : "")
                .build()
                .toString();

        var request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/external/v1/clients"))
                .header("X-API-Key", apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .timeout(Duration.ofSeconds(10))
                .build();

        try {
            var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200 && response.statusCode() != 201) {
                LOG.errorf("BillFlow client creation failed: %d - %s", response.statusCode(), response.body());
                throw new BusinessException("BILLING_SERVICE_ERROR", "Error creating client in billing system: " + response.body());
            }
            return parseClientResponse(response.body());
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("BILLING_SERVICE_UNAVAILABLE", "Billing service is unavailable: " + e.getMessage());
        }
    }

    public BillFlowInvoiceResponse createInvoice(BillFlowInvoiceRequest invoiceRequest) {
        var linesBuilder = Json.createArrayBuilder();
        for (var line : invoiceRequest.lines()) {
            var lineObj = Json.createObjectBuilder()
                    .add("description", line.description())
                    .add("quantity", line.quantity())
                    .add("unitPrice", line.unitPrice())
                    .add("taxTreatment", line.taxTreatment() != null ? line.taxTreatment() : "EXEMPT")
                    .build();
            linesBuilder.add(lineObj);
        }

        var jsonBody = Json.createObjectBuilder()
                .add("clientDocumentNumber", invoiceRequest.clientDocumentNumber())
                .add("ncfType", invoiceRequest.ncfType())
                .add("dueDate", invoiceRequest.dueDate())
                .add("autoIssue", invoiceRequest.autoIssue())
                .add("lines", linesBuilder)
                .build()
                .toString();

        var request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/external/v1/invoices"))
                .header("X-API-Key", apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .timeout(Duration.ofSeconds(10))
                .build();

        try {
            var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200 && response.statusCode() != 201) {
                LOG.errorf("BillFlow invoice creation failed: %d - %s", response.statusCode(), response.body());
                throw new BusinessException("BILLING_SERVICE_ERROR", "Error creating invoice in billing system: " + response.body());
            }
            return parseInvoiceResponse(response.body());
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("BILLING_SERVICE_UNAVAILABLE", "Billing service is unavailable: " + e.getMessage());
        }
    }

    private BillFlowClientResponse parseClientResponse(String body) {
        try (var reader = Json.createReader(new StringReader(body))) {
            JsonObject json = reader.readObject();
            return new BillFlowClientResponse(
                    json.getJsonNumber("id").longValue(),
                    json.getString("firstName", ""),
                    json.getString("lastName", ""),
                    json.getString("idDocumentType", ""),
                    json.getString("idDocumentNumber", ""),
                    json.getBoolean("created", false)
            );
        }
    }

    private BillFlowInvoiceResponse parseInvoiceResponse(String body) {
        try (var reader = Json.createReader(new StringReader(body))) {
            JsonObject json = reader.readObject();
            return new BillFlowInvoiceResponse(
                    json.getJsonNumber("id").longValue(),
                    json.getString("invoiceCode", ""),
                    json.getString("ncfNumber", null),
                    json.getString("status", ""),
                    json.containsKey("clientId") && !json.isNull("clientId") ? json.getJsonNumber("clientId").longValue() : null,
                    json.getString("clientName", ""),
                    json.containsKey("totalAmount") && !json.isNull("totalAmount") ? json.getJsonNumber("totalAmount").bigDecimalValue() : BigDecimal.ZERO
            );
        }
    }
}
