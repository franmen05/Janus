package com.janus;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.Matchers.containsString;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ComplianceValidationTest {

    private static Long operationId;

    @Test
    @Order(1)
    void testSetupOperation() {
        operationId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-TEST-001", "estimatedArrival": "2025-12-01T10:00:00", "blAvailability": "ORIGINAL", "notes": "Compliance test"}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");
    }

    @Test
    @Order(2)
    void testBlockedTransitionWithoutDocs() {
        // AIR only needs BL, INVOICE, PACKING_LIST (no CERTIFICATE required)
        // Trying to go to DOCUMENTATION_COMPLETE without any docs should fail
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"newStatus": "DOCUMENTATION_COMPLETE"}
                        """)
                .when().post("/api/operations/{id}/change-status", operationId)
                .then()
                .statusCode(400)
                .body("error", containsString("Compliance validation failed"));
    }

    @Test
    @Order(3)
    void testDryRunEndpoint() {
        given()
                .auth().basic("admin", "admin123")
                .queryParam("targetStatus", "DOCUMENTATION_COMPLETE")
                .when().get("/api/operations/{id}/compliance/validate", operationId)
                .then()
                .statusCode(200)
                .body("passed", is(false))
                .body("errors.size()", is(3));  // Missing BL, COMMERCIAL_INVOICE, PACKING_LIST
    }

    @Test
    @Order(4)
    void testDryRunEndpointReturnsSpecificErrors() {
        given()
                .auth().basic("admin", "admin123")
                .queryParam("targetStatus", "DOCUMENTATION_COMPLETE")
                .when().get("/api/operations/{id}/compliance/validate", operationId)
                .then()
                .statusCode(200)
                .body("passed", is(false));
    }

    @Test
    @Order(5)
    void testCancelledTransitionBypassesCompliance() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"newStatus": "CANCELLED"}
                        """)
                .when().post("/api/operations/{id}/change-status", operationId)
                .then()
                .statusCode(200);
    }

    @Test
    @Order(10)
    void testMARITIMERequiresCertificate() {
        // Create a MARITIME operation
        var maritimeOpId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "MARITIME", "operationCategory": "CATEGORY_1", "containerNumber": "CONT-001", "blNumber": "BL-TEST-001", "estimatedArrival": "2025-12-01T10:00:00", "blAvailability": "ORIGINAL"}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // Dry-run should show CERTIFICATE required for MARITIME
        given()
                .auth().basic("admin", "admin123")
                .queryParam("targetStatus", "DOCUMENTATION_COMPLETE")
                .when().get("/api/operations/{id}/compliance/validate", maritimeOpId)
                .then()
                .statusCode(200)
                .body("passed", is(false));
    }

    @Test
    @Order(11)
    void testCarrierCannotAccessCompliance() {
        given()
                .auth().basic("carrier", "carrier123")
                .queryParam("targetStatus", "DOCUMENTATION_COMPLETE")
                .when().get("/api/operations/{id}/compliance/validate", operationId)
                .then()
                .statusCode(403);
    }

    @Test
    @Order(12)
    void testAccountingCannotAccessCompliance() {
        given()
                .auth().basic("accounting", "acc123")
                .queryParam("targetStatus", "DOCUMENTATION_COMPLETE")
                .when().get("/api/operations/{id}/compliance/validate", operationId)
                .then()
                .statusCode(403);
    }
}
