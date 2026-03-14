package com.janus.exchangerate.infrastructure;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.json.Json;
import jakarta.json.JsonObject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import java.io.StringReader;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@ApplicationScoped
public class ExternalRateService {

    @ConfigProperty(name = "janus.exchange-rate.api-url",
            defaultValue = "https://api.exchangerate-api.com/v4/latest/USD")
    String apiUrl;

    public BigDecimal fetchDopRate() {
        try {
            var client = HttpClient.newHttpClient();
            var request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .GET()
                    .build();

            var response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("Exchange rate API returned status: " + response.statusCode());
            }

            try (var reader = Json.createReader(new StringReader(response.body()))) {
                JsonObject json = reader.readObject();
                JsonObject rates = json.getJsonObject("rates");
                var dopValue = rates.getJsonNumber("DOP");
                if (dopValue == null) {
                    throw new RuntimeException("DOP rate not found in exchange rate API response");
                }
                return dopValue.bigDecimalValue();
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch exchange rate from external API: " + e.getMessage(), e);
        }
    }
}
