package com.janus;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class DeclarationResourceTest {

    private static Long operationId;
    private static Long preliminaryId;
    private static Long finalId;

    @Test
    @Order(1)
    void testSetup() {
        operationId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-TEST-001", "blOriginalAvailable": true}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");
    }

    @Test
    @Order(2)
    void testRegisterPreliminaryDeclaration() {
        preliminaryId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "declarationNumber": "PRELIM-001",
                            "fobValue": 10000.00,
                            "cifValue": 12000.00,
                            "taxableBase": 12000.00,
                            "totalTaxes": 1800.00,
                            "freightValue": 1500.00,
                            "insuranceValue": 500.00,
                            "gattMethod": "Transaction Value"
                        }
                        """)
                .when().post("/api/operations/{opId}/declarations/preliminary", operationId)
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("declarationType", is("PRELIMINARY"))
                .body("declarationNumber", is("PRELIM-001"))
                .extract().jsonPath().getLong("id");
    }

    @Test
    @Order(3)
    void testDuplicatePreliminaryRejected() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"declarationNumber": "PRELIM-DUP", "fobValue": 5000.00}
                        """)
                .when().post("/api/operations/{opId}/declarations/preliminary", operationId)
                .then()
                .statusCode(400);
    }

    @Test
    @Order(4)
    void testRegisterFinalDeclaration() {
        finalId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "declarationNumber": "FINAL-001",
                            "fobValue": 10500.00,
                            "cifValue": 12500.00,
                            "taxableBase": 12500.00,
                            "totalTaxes": 1875.00,
                            "freightValue": 1500.00,
                            "insuranceValue": 500.00,
                            "gattMethod": "Transaction Value"
                        }
                        """)
                .when().post("/api/operations/{opId}/declarations/final", operationId)
                .then()
                .statusCode(201)
                .body("declarationType", is("FINAL"))
                .extract().jsonPath().getLong("id");
    }

    @Test
    @Order(5)
    void testListDeclarations() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{opId}/declarations", operationId)
                .then()
                .statusCode(200)
                .body("size()", is(2));
    }

    @Test
    @Order(6)
    void testGetDeclarationById() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{opId}/declarations/{id}", operationId, preliminaryId)
                .then()
                .statusCode(200)
                .body("declarationType", is("PRELIMINARY"));
    }

    @Test
    @Order(7)
    void testAddTariffLineToPreliminary() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "lineNumber": 1,
                            "tariffCode": "8471.30.00",
                            "description": "Laptop computers",
                            "quantity": 100.0000,
                            "unitValue": 100.00,
                            "totalValue": 10000.00,
                            "taxRate": 0.1500,
                            "taxAmount": 1500.00
                        }
                        """)
                .when().post("/api/operations/{opId}/declarations/{id}/tariff-lines", operationId, preliminaryId)
                .then()
                .statusCode(201)
                .body("lineNumber", is(1))
                .body("tariffCode", is("8471.30.00"));
    }

    @Test
    @Order(8)
    void testAddTariffLineToFinal() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "lineNumber": 1,
                            "tariffCode": "8471.30.00",
                            "description": "Laptop computers",
                            "quantity": 105.0000,
                            "unitValue": 100.00,
                            "totalValue": 10500.00,
                            "taxRate": 0.1500,
                            "taxAmount": 1575.00
                        }
                        """)
                .when().post("/api/operations/{opId}/declarations/{id}/tariff-lines", operationId, finalId)
                .then()
                .statusCode(201);
    }

    @Test
    @Order(9)
    void testGetTariffLines() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{opId}/declarations/{id}/tariff-lines", operationId, preliminaryId)
                .then()
                .statusCode(200)
                .body("size()", is(1));
    }

    @Test
    @Order(10)
    void testExecuteCrossingWithDiscrepancies() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .when().post("/api/operations/{opId}/declarations/crossing/execute", operationId)
                .then()
                .statusCode(201)
                .body("status", is("DISCREPANCY"))
                .body("discrepancies.size()", greaterThanOrEqualTo(1));
    }

    @Test
    @Order(11)
    void testGetCrossingResult() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{opId}/declarations/crossing", operationId)
                .then()
                .statusCode(200)
                .body("status", is("DISCREPANCY"));
    }

    @Test
    @Order(12)
    void testResolveCrossing() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"comment": "Discrepancy reviewed and accepted"}
                        """)
                .when().post("/api/operations/{opId}/declarations/crossing/resolve", operationId)
                .then()
                .statusCode(200)
                .body("status", is("RESOLVED"))
                .body("resolvedBy", is("admin"));
    }

    @Test
    @Order(13)
    void testClientCanViewCrossing() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{opId}/declarations/crossing", operationId)
                .then()
                .statusCode(200);
    }

    @Test
    @Order(14)
    void testClientCannotRegisterDeclaration() {
        given()
                .auth().basic("client", "client123")
                .contentType(ContentType.JSON)
                .body("""
                        {"declarationNumber": "BLOCKED"}
                        """)
                .when().post("/api/operations/{opId}/declarations/preliminary", operationId)
                .then()
                .statusCode(403);
    }

    // ---- Test matching crossing ----

    @Test
    @Order(20)
    void testCrossingWithMatch() {
        var opId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-TEST-001", "blOriginalAvailable": true}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // Register identical preliminary and final
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"declarationNumber": "MATCH-P", "fobValue": 5000.00, "cifValue": 6000.00,
                         "taxableBase": 6000.00, "totalTaxes": 900.00}
                        """)
                .when().post("/api/operations/{opId}/declarations/preliminary", opId)
                .then().statusCode(201);

        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"declarationNumber": "MATCH-F", "fobValue": 5000.00, "cifValue": 6000.00,
                         "taxableBase": 6000.00, "totalTaxes": 900.00}
                        """)
                .when().post("/api/operations/{opId}/declarations/final", opId)
                .then().statusCode(201);

        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .when().post("/api/operations/{opId}/declarations/crossing/execute", opId)
                .then()
                .statusCode(201)
                .body("status", is("MATCH"))
                .body("discrepancies.size()", is(0));
    }
}
