package com.janus.port.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.janus.port.api.dto.CatalogCountryResponse;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class PortCatalogService {

    @Inject
    ObjectMapper objectMapper;

    private JsonNode catalogRoot;

    @PostConstruct
    void init() {
        try (InputStream is = Thread.currentThread().getContextClassLoader()
                .getResourceAsStream("port-catalog.json")) {
            if (is == null) {
                throw new IllegalStateException("port-catalog.json not found on classpath");
            }
            catalogRoot = objectMapper.readTree(is);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load port-catalog.json", e);
        }
    }

    public List<CatalogCountryResponse> getCountries() {
        var countries = new ArrayList<CatalogCountryResponse>();
        for (JsonNode country : catalogRoot.get("countries")) {
            countries.add(new CatalogCountryResponse(
                    country.get("code").asText(),
                    country.get("name").asText(),
                    country.get("nameEs").asText()
            ));
        }
        return countries;
    }

    public record CatalogPort(String code, String name, String description) {}

    public List<CatalogPort> getPortsByCountry(String countryCode) {
        for (JsonNode country : catalogRoot.get("countries")) {
            if (country.get("code").asText().equalsIgnoreCase(countryCode)) {
                var ports = new ArrayList<CatalogPort>();
                for (JsonNode port : country.get("ports")) {
                    ports.add(new CatalogPort(
                            port.get("code").asText(),
                            port.get("name").asText(),
                            port.has("description") ? port.get("description").asText() : null
                    ));
                }
                return ports;
            }
        }
        return List.of();
    }
}
