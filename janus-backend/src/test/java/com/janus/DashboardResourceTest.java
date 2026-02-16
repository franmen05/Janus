package com.janus;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.notNullValue;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class DashboardResourceTest {

    @Test
    @Order(1)
    void testGetMetrics() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/dashboard/metrics")
                .then()
                .statusCode(200)
                .body("operationsByStatus", notNullValue())
                .body("operationsByStatus.DRAFT", notNullValue());
    }

    @Test
    @Order(2)
    void testMetricsWithFilters() {
        given()
                .auth().basic("admin", "admin123")
                .queryParam("cargoType", "FCL")
                .when().get("/api/dashboard/metrics")
                .then()
                .statusCode(200)
                .body("operationsByStatus", notNullValue());
    }

    @Test
    @Order(3)
    void testAccountingCanAccessDashboard() {
        given()
                .auth().basic("accounting", "acc123")
                .when().get("/api/dashboard/metrics")
                .then()
                .statusCode(200);
    }

    @Test
    @Order(4)
    void testAgentCanAccessDashboard() {
        given()
                .auth().basic("agent", "agent123")
                .when().get("/api/dashboard/metrics")
                .then()
                .statusCode(200);
    }

    @Test
    @Order(5)
    void testClientCannotAccessDashboard() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/dashboard/metrics")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(6)
    void testCarrierCannotAccessDashboard() {
        given()
                .auth().basic("carrier", "carrier123")
                .when().get("/api/dashboard/metrics")
                .then()
                .statusCode(403);
    }
}
