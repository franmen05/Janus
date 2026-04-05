package com.janus.payment;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class LiquidationApprovalConfigTest {

    @Test
    @Order(1)
    void testConfigEndpointReturnsApprovalRequired() {
        // The seeded config has LIQUIDATION_APPROVAL_REQUIRED enabled
        given()
                .auth().basic("agent", "agent123")
                .when().get("/api/operations/1/liquidation/config")
                .then()
                .statusCode(200)
                .body("approvalRequired", is(true));
    }

    @Test
    @Order(2)
    void testConfigEndpointAccessibleByCustomer() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/1/liquidation/config")
                .then()
                .statusCode(200)
                .body("approvalRequired", is(true));
    }

    @Test
    @Order(3)
    void testConfigEndpointRequiresAuth() {
        given()
                .when().get("/api/operations/1/liquidation/config")
                .then()
                .statusCode(401);
    }
}
