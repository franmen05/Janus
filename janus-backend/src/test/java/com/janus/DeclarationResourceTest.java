package com.janus;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

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
    private static Long clientApprovalOpId;
    private static Long clientApprovalDeclId;
    private static Long otherClientOpId;
    private static Long otherClientDeclId;

    @Test
    @Order(1)
    void testSetup() {
        operationId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-TEST-001", "blAvailability": "ORIGINAL"}
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
    void testAdvanceToDeclarationInProgress() {
        // Upload mandatory documents
        uploadDocument(operationId, "BL");
        uploadDocument(operationId, "COMMERCIAL_INVOICE");
        uploadDocument(operationId, "PACKING_LIST");

        // Technical approve the preliminary declaration (required for ANALYST_ASSIGNED)
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"comment": "Technical OK"}
                        """)
                .when().post("/api/operations/{opId}/declarations/{id}/approve-technical", operationId, preliminaryId)
                .then().statusCode(200);

        changeStatus(operationId, "DOCUMENTATION_COMPLETE");
        changeStatus(operationId, "IN_REVIEW");
        changeStatus(operationId, "PRELIQUIDATION_REVIEW");
        changeStatus(operationId, "ANALYST_ASSIGNED");
        changeStatus(operationId, "DECLARATION_IN_PROGRESS");
    }

    @Test
    @Order(9)
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
    @Order(10)
    void testGetTariffLines() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{opId}/declarations/{id}/tariff-lines", operationId, preliminaryId)
                .then()
                .statusCode(200)
                .body("size()", is(1));
    }

    @Test
    @Order(11)
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
    @Order(12)
    void testGetCrossingResult() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{opId}/declarations/crossing", operationId)
                .then()
                .statusCode(200)
                .body("status", is("DISCREPANCY"));
    }

    @Test
    @Order(13)
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
    @Order(14)
    void testClientCanViewCrossing() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{opId}/declarations/crossing", operationId)
                .then()
                .statusCode(200);
    }

    @Test
    @Order(15)
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
                        {"clientId": 1, "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-TEST-001", "blAvailability": "ORIGINAL"}
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

    // ---- Client approval tests ----

    @Test
    @Order(30)
    void testClientApprovalSetup() {
        // Create operation with clientId=1 (matches "client" user)
        clientApprovalOpId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-CLIENT-APPROVAL", "blAvailability": "ORIGINAL"}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // Upload mandatory docs
        uploadDocument(clientApprovalOpId, "BL");
        uploadDocument(clientApprovalOpId, "COMMERCIAL_INVOICE");
        uploadDocument(clientApprovalOpId, "PACKING_LIST");

        // Register preliminary declaration
        clientApprovalDeclId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"declarationNumber": "PRELIM-CA", "fobValue": 5000.00, "cifValue": 6000.00,
                         "taxableBase": 6000.00, "totalTaxes": 900.00, "freightValue": 800.00, "insuranceValue": 200.00}
                        """)
                .when().post("/api/operations/{opId}/declarations/preliminary", clientApprovalOpId)
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // Technical approve
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"comment": "Technical OK"}
                        """)
                .when().post("/api/operations/{opId}/declarations/{id}/approve-technical", clientApprovalOpId, clientApprovalDeclId)
                .then().statusCode(200);

        // Advance: DRAFT -> DOCUMENTATION_COMPLETE -> IN_REVIEW -> PRELIQUIDATION_REVIEW -> ANALYST_ASSIGNED -> DECLARATION_IN_PROGRESS
        changeStatus(clientApprovalOpId, "DOCUMENTATION_COMPLETE");
        changeStatus(clientApprovalOpId, "IN_REVIEW");
        changeStatus(clientApprovalOpId, "PRELIQUIDATION_REVIEW");
        changeStatus(clientApprovalOpId, "ANALYST_ASSIGNED");
        changeStatus(clientApprovalOpId, "DECLARATION_IN_PROGRESS");

        // Verify operation is in DECLARATION_IN_PROGRESS
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{id}", clientApprovalOpId)
                .then()
                .statusCode(200)
                .body("status", is("DECLARATION_IN_PROGRESS"));
    }

    @Test
    @Order(31)
    void testClientCanListDeclarations() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{opId}/declarations", clientApprovalOpId)
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1));
    }

    @Test
    @Order(32)
    void testClientCannotApproveFinalForOtherClient() {
        // Create operation with clientId=2 (different from "client" user's clientId=1)
        otherClientOpId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 2, "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-OTHER-CLIENT", "blAvailability": "ORIGINAL"}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // Register a declaration on the other client's operation
        otherClientDeclId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"declarationNumber": "PRELIM-OTHER", "fobValue": 3000.00, "cifValue": 3500.00,
                         "taxableBase": 3500.00, "totalTaxes": 525.00}
                        """)
                .when().post("/api/operations/{opId}/declarations/preliminary", otherClientOpId)
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // Client tries to approve on other client's operation -> 403
        given()
                .auth().basic("client", "client123")
                .contentType(ContentType.JSON)
                .body("""
                        {"comment": "Should be forbidden"}
                        """)
                .when().post("/api/operations/{opId}/declarations/{id}/approve-final", otherClientOpId, otherClientDeclId)
                .then()
                .statusCode(403);
    }

    @Test
    @Order(33)
    void testAgentCannotApproveFinal() {
        given()
                .auth().basic("agent", "agent123")
                .contentType(ContentType.JSON)
                .body("""
                        {"comment": "Agent trying to approve"}
                        """)
                .when().post("/api/operations/{opId}/declarations/{id}/approve-final", clientApprovalOpId, clientApprovalDeclId)
                .then()
                .statusCode(403);
    }

    @Test
    @Order(34)
    void testSendApprovalLink() {
        given()
                .auth().basic("agent", "agent123")
                .contentType(ContentType.JSON)
                .when().post("/api/operations/{opId}/declarations/{id}/send-approval-link", clientApprovalOpId, clientApprovalDeclId)
                .then()
                .statusCode(200);
    }

    @Test
    @Order(35)
    void testClientCannotSendApprovalLink() {
        given()
                .auth().basic("client", "client123")
                .contentType(ContentType.JSON)
                .when().post("/api/operations/{opId}/declarations/{id}/send-approval-link", clientApprovalOpId, clientApprovalDeclId)
                .then()
                .statusCode(403);
    }

    @Test
    @Order(36)
    void testClientCanApproveFinal() {
        given()
                .auth().basic("client", "client123")
                .contentType(ContentType.JSON)
                .body("""
                        {"comment": "Client approves final declaration"}
                        """)
                .when().post("/api/operations/{opId}/declarations/{id}/approve-final", clientApprovalOpId, clientApprovalDeclId)
                .then()
                .statusCode(200)
                .body("finalApprovedBy", is("client"));
    }

    // ---- Helper methods ----

    private static File createTempPdf() {
        try {
            var tempFile = File.createTempFile("test-doc", ".pdf");
            tempFile.deleteOnExit();
            Files.write(tempFile.toPath(), "%PDF-1.4 test content".getBytes());
            return tempFile;
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private static void uploadDocument(Long operationId, String documentType) {
        given()
                .auth().basic("admin", "admin123")
                .multiPart("file", createTempPdf(), "application/pdf")
                .multiPart("documentType", documentType)
                .when().post("/api/operations/{opId}/documents", operationId)
                .then()
                .statusCode(201);
    }

    private static void changeStatus(Long opId, String newStatus) {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"newStatus": "%s"}
                        """.formatted(newStatus))
                .when().post("/api/operations/{id}/change-status", opId)
                .then()
                .statusCode(200);
    }
}
