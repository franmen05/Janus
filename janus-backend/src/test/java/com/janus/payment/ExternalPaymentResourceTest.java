package com.janus.payment;

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

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ExternalPaymentResourceTest {

    private static Long operationId;

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

    private static void uploadDocument(Long opId, String documentType) {
        given()
                .auth().basic("admin", "admin123")
                .multiPart("file", createTempPdf(), "application/pdf")
                .multiPart("documentType", documentType)
                .when().post("/api/operations/{opId}/documents", opId)
                .then()
                .statusCode(201);
    }

    private static void uploadAllMandatoryDocs(Long opId) {
        uploadDocument(opId, "BL");
        uploadDocument(opId, "COMMERCIAL_INVOICE");
        uploadDocument(opId, "PACKING_LIST");
    }

    private static Long setupPreliminaryWithApprovals(Long opId) {
        var declId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"declarationNumber": "PRELIM-EXT-TEST", "fobValue": 1000.00, "cifValue": 1200.00,
                         "taxableBase": 1200.00, "totalTaxes": 180.00, "freightValue": 150.00, "insuranceValue": 50.00}
                        """)
                .when().post("/api/operations/{opId}/declarations/preliminary", opId)
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"comment": "Technical OK"}
                        """)
                .when().post("/api/operations/{opId}/declarations/{id}/approve-technical", opId, declId)
                .then().statusCode(200);

        return declId;
    }

    private static void approveFinalDeclaration(Long opId, Long declarationId) {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"comment": "Final approval"}
                        """)
                .when().post("/api/operations/{opId}/declarations/{id}/approve-final", opId, declarationId)
                .then().statusCode(200);
    }

    private static void registerFinalDeclarationAndCrossing(Long opId) {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"declarationNumber": "FINAL-EXT-TEST", "fobValue": 1000.00, "cifValue": 1200.00,
                         "taxableBase": 1200.00, "totalTaxes": 180.00, "freightValue": 150.00, "insuranceValue": 50.00}
                        """)
                .when().post("/api/operations/{opId}/declarations/final", opId)
                .then().statusCode(201);

        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .when().post("/api/operations/{opId}/declarations/crossing/execute", opId)
                .then().statusCode(201);
    }

    private static void setInspectionType(Long opId) {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"inspectionType": "VISUAL"}
                        """)
                .when().post("/api/operations/{id}/inspection/type", opId)
                .then()
                .statusCode(200);
    }

    // ---- Setup: create operation and advance to DEFINITIVE liquidation ----

    @Test
    @Order(1)
    void setupOperationWithDefinitiveLiquidation() {
        // Create operation
        operationId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"accountId": 1, "operationType": "IMPORT", "transportMode": "AIR", "operationCategory": "CATEGORY_1",
                         "blNumber": "BL-EXT-PAY-001", "estimatedArrival": "2025-12-01T10:00:00", "blAvailability": "ORIGINAL",
                         "incoterm": "FOB", "arrivalPortId": 1}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // Upload mandatory docs
        uploadAllMandatoryDocs(operationId);

        // Setup preliminary declaration with technical approval
        var declId = setupPreliminaryWithApprovals(operationId);

        // DRAFT -> DOCUMENTATION_COMPLETE -> IN_REVIEW -> PRELIQUIDATION_REVIEW
        var preTransitions = new String[]{
                "DOCUMENTATION_COMPLETE", "IN_REVIEW", "PRELIQUIDATION_REVIEW"
        };
        for (var status : preTransitions) {
            given()
                    .auth().basic("admin", "admin123")
                    .contentType(ContentType.JSON)
                    .body("""
                            {"newStatus": "%s"}
                            """.formatted(status))
                    .when().post("/api/operations/{id}/change-status", operationId)
                    .then().statusCode(200);
        }

        // Final approve (auto-advances from PRELIQUIDATION_REVIEW to DECLARATION_IN_PROGRESS)
        approveFinalDeclaration(operationId, declId);

        // Advance to SUBMITTED_TO_CUSTOMS
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"newStatus": "SUBMITTED_TO_CUSTOMS"}
                        """)
                .when().post("/api/operations/{id}/change-status", operationId)
                .then().statusCode(200);

        // Register final declaration and crossing
        registerFinalDeclarationAndCrossing(operationId);

        // Set inspection type
        setInspectionType(operationId);

        // Advance to VALUATION_REVIEW -> PAYMENT_PREPARATION
        var postTransitions = new String[]{"VALUATION_REVIEW", "PAYMENT_PREPARATION"};
        for (var status : postTransitions) {
            given()
                    .auth().basic("admin", "admin123")
                    .contentType(ContentType.JSON)
                    .body("""
                            {"newStatus": "%s"}
                            """.formatted(status))
                    .when().post("/api/operations/{id}/change-status", operationId)
                    .then().statusCode(200);
        }

        // Generate liquidation
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"agencyServiceFee": 100.00}
                        """)
                .when().post("/api/operations/{opId}/liquidation", operationId)
                .then().statusCode(201);

        // Approve liquidation
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"comment": "Approved for external payment test"}
                        """)
                .when().post("/api/operations/{opId}/liquidation/approve", operationId)
                .then().statusCode(200);

        // Make definitive
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"dgaPaymentCode": "DGA-EXT-001"}
                        """)
                .when().post("/api/operations/{opId}/liquidation/definitive", operationId)
                .then().statusCode(200);
    }

    // ---- Auth tests ----

    @Test
    @Order(10)
    void testMissingApiKey_returns401() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"amount": 500.00, "paymentMethod": "BANK_TRANSFER", "paymentDate": "2025-12-01"}
                        """)
                .when().post("/api/external/operations/{opId}/liquidation/payment", operationId)
                .then()
                .statusCode(401)
                .body("error", is("Missing API key"));
    }

    @Test
    @Order(11)
    void testInvalidApiKey_returns401() {
        given()
                .header("X-API-Key", "wrong-key")
                .contentType(ContentType.JSON)
                .body("""
                        {"amount": 500.00, "paymentMethod": "BANK_TRANSFER", "paymentDate": "2025-12-01"}
                        """)
                .when().post("/api/external/operations/{opId}/liquidation/payment", operationId)
                .then()
                .statusCode(401)
                .body("error", is("Invalid API key"));
    }

    @Test
    @Order(12)
    void testEmptyApiKey_returns401() {
        given()
                .header("X-API-Key", "")
                .contentType(ContentType.JSON)
                .body("""
                        {"amount": 500.00, "paymentMethod": "BANK_TRANSFER", "paymentDate": "2025-12-01"}
                        """)
                .when().post("/api/external/operations/{opId}/liquidation/payment", operationId)
                .then()
                .statusCode(401)
                .body("error", is("Missing API key"));
    }

    // ---- Validation tests ----

    @Test
    @Order(20)
    void testMissingRequiredFields_returns400() {
        given()
                .header("X-API-Key", "test-api-key-secret")
                .contentType(ContentType.JSON)
                .body("""
                        {"notes": "missing required fields"}
                        """)
                .when().post("/api/external/operations/{opId}/liquidation/payment", operationId)
                .then()
                .statusCode(400)
                .body("title", is("Constraint Violation"));
    }

    @Test
    @Order(21)
    void testOperationNotFound_returns400() {
        given()
                .header("X-API-Key", "test-api-key-secret")
                .contentType(ContentType.JSON)
                .body("""
                        {"amount": 500.00, "paymentMethod": "BANK_TRANSFER", "paymentDate": "2025-12-01"}
                        """)
                .when().post("/api/external/operations/{opId}/liquidation/payment", 999999)
                .then()
                .statusCode(400)
                .body("errorCode", is("LIQUIDATION_NOT_FOUND"));
    }

    // ---- Business logic tests ----

    @Test
    @Order(30)
    void testSuccessfulPayment_returns201() {
        given()
                .header("X-API-Key", "test-api-key-secret")
                .contentType(ContentType.JSON)
                .body("""
                        {"amount": 500.00, "paymentMethod": "BANK_TRANSFER", "paymentDate": "2025-12-01",
                         "dgaReference": "DGA-EXT-REF", "bankReference": "BANK-EXT-REF", "notes": "External payment"}
                        """)
                .when().post("/api/external/operations/{opId}/liquidation/payment", operationId)
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("paymentMethod", is("BANK_TRANSFER"))
                .body("registeredBy", is("external-billing-system"));
    }

    @Test
    @Order(31)
    void testDoublePayment_liquidationNowPaid_returns400() {
        given()
                .header("X-API-Key", "test-api-key-secret")
                .contentType(ContentType.JSON)
                .body("""
                        {"amount": 500.00, "paymentMethod": "BANK_TRANSFER", "paymentDate": "2025-12-01"}
                        """)
                .when().post("/api/external/operations/{opId}/liquidation/payment", operationId)
                .then()
                .statusCode(400)
                .body("errorCode", is("LIQUIDATION_NOT_DEFINITIVE"));
    }

    // ---- Non-interference test ----

    @Test
    @Order(40)
    void testInternalEndpointStillRequiresBasicAuth() {
        given()
                .header("X-API-Key", "test-api-key-secret")
                .contentType(ContentType.JSON)
                .body("""
                        {"amount": 500.00, "paymentMethod": "BANK_TRANSFER", "paymentDate": "2025-12-01"}
                        """)
                .when().post("/api/operations/{opId}/liquidation/payment", operationId)
                .then()
                .statusCode(401);
    }
}
