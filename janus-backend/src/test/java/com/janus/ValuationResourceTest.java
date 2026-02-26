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
class ValuationResourceTest {

    private static Long operationId;
    private static Long permitId;

    // ── Helpers ───────────────────────────────────────────────────────────

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

    private static void setupDeclarationWithApprovals(Long opId) {
        var declId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"declarationNumber": "PRELIM-VAL-TEST", "fobValue": 1000.00, "cifValue": 1200.00,
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

        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"comment": "Final OK"}
                        """)
                .when().post("/api/operations/{opId}/declarations/{id}/approve-final", opId, declId)
                .then().statusCode(200);
    }

    private static void advanceToStatus(Long opId, String targetStatus) {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"newStatus": "%s"}
                        """.formatted(targetStatus))
                .when().post("/api/operations/{id}/change-status", opId)
                .then()
                .statusCode(200);
    }

    /**
     * Creates an operation and advances it to VALUATION_REVIEW with VISUAL inspection type.
     */
    private static Long createOperationAtValuationReview() {
        var opId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "AIR", "operationCategory": "CATEGORY_1",
                         "blNumber": "BL-VAL-TEST", "blAvailability": "ORIGINAL"}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        uploadAllMandatoryDocs(opId);
        setupDeclarationWithApprovals(opId);

        var statuses = new String[]{
                "DOCUMENTATION_COMPLETE", "IN_REVIEW", "PRELIQUIDATION_REVIEW",
                "ANALYST_ASSIGNED", "DECLARATION_IN_PROGRESS", "SUBMITTED_TO_CUSTOMS"
        };
        for (var status : statuses) {
            advanceToStatus(opId, status);
        }

        // Set inspection type to VISUAL (does not auto-advance like EXPRESO)
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"inspectionType": "VISUAL"}
                        """)
                .when().post("/api/operations/{id}/inspection/type", opId)
                .then()
                .statusCode(200);

        // Now advance to VALUATION_REVIEW
        advanceToStatus(opId, "VALUATION_REVIEW");

        return opId;
    }

    // ── Setup: create operation at VALUATION_REVIEW ──────────────────────

    @Test
    @Order(1)
    void testSetupOperation() {
        operationId = createOperationAtValuationReview();

        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{id}", operationId)
                .then()
                .statusCode(200)
                .body("status", is("VALUATION_REVIEW"));
    }

    // ── Checklist ────────────────────────────────────────────────────────

    @Test
    @Order(10)
    void testGetChecklist() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{id}/valuation/checklist", operationId)
                .then()
                .statusCode(200)
                .body("items.size()", greaterThanOrEqualTo(1))
                .body("allPassed", notNullValue());
    }

    @Test
    @Order(11)
    void testAccountingCanGetChecklist() {
        given()
                .auth().basic("accounting", "acc123")
                .when().get("/api/operations/{id}/valuation/checklist", operationId)
                .then()
                .statusCode(200);
    }

    @Test
    @Order(12)
    void testClientCannotGetChecklist() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{id}/valuation/checklist", operationId)
                .then()
                .statusCode(403);
    }

    // ── Local charges validated ──────────────────────────────────────────

    @Test
    @Order(20)
    void testToggleLocalChargesValidated() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"validated": true}
                        """)
                .when().patch("/api/operations/{id}/valuation/local-charges-validated", operationId)
                .then()
                .statusCode(200)
                .body("localChargesValidated", is(true));
    }

    @Test
    @Order(21)
    void testToggleLocalChargesValidatedOff() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"validated": false}
                        """)
                .when().patch("/api/operations/{id}/valuation/local-charges-validated", operationId)
                .then()
                .statusCode(200)
                .body("localChargesValidated", is(false));
    }

    @Test
    @Order(22)
    void testClientCannotToggleLocalCharges() {
        given()
                .auth().basic("client", "client123")
                .contentType(ContentType.JSON)
                .body("""
                        {"validated": true}
                        """)
                .when().patch("/api/operations/{id}/valuation/local-charges-validated", operationId)
                .then()
                .statusCode(403);
    }

    // ── Permits CRUD ─────────────────────────────────────────────────────

    @Test
    @Order(30)
    void testCreatePermit() {
        permitId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"permitType": "VUCE", "status": "APROBADO", "referenceNumber": "VUCE-001", "notes": "Test permit"}
                        """)
                .when().post("/api/operations/{id}/valuation/permits", operationId)
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("permitType", is("VUCE"))
                .body("status", is("APROBADO"))
                .body("referenceNumber", is("VUCE-001"))
                .extract().jsonPath().getLong("id");
    }

    @Test
    @Order(31)
    void testListPermits() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{id}/valuation/permits", operationId)
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1));
    }

    @Test
    @Order(32)
    void testAccountingCanListPermits() {
        given()
                .auth().basic("accounting", "acc123")
                .when().get("/api/operations/{id}/valuation/permits", operationId)
                .then()
                .statusCode(200);
    }

    @Test
    @Order(33)
    void testUpdatePermit() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"permitType": "VUCE", "status": "APROBADO", "referenceNumber": "VUCE-001-UPDATED", "notes": "Updated permit"}
                        """)
                .when().put("/api/operations/{opId}/valuation/permits/{permitId}", operationId, permitId)
                .then()
                .statusCode(200)
                .body("referenceNumber", is("VUCE-001-UPDATED"))
                .body("notes", is("Updated permit"));
    }

    @Test
    @Order(34)
    void testDeletePermit() {
        given()
                .auth().basic("admin", "admin123")
                .when().delete("/api/operations/{opId}/valuation/permits/{permitId}", operationId, permitId)
                .then()
                .statusCode(204);
    }

    @Test
    @Order(35)
    void testClientCannotCreatePermit() {
        given()
                .auth().basic("client", "client123")
                .contentType(ContentType.JSON)
                .body("""
                        {"permitType": "FDA", "referenceNumber": "FDA-001"}
                        """)
                .when().post("/api/operations/{id}/valuation/permits", operationId)
                .then()
                .statusCode(403);
    }

    @Test
    @Order(36)
    void testPermitAutoTransitionToPendingExternalApproval() {
        // Create a permit with blocking status (EN_TRAMITE or PENDIENTE)
        var blockingPermitId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"permitType": "FDA", "status": "EN_TRAMITE", "referenceNumber": "FDA-BLOCK"}
                        """)
                .when().post("/api/operations/{id}/valuation/permits", operationId)
                .then()
                .statusCode(201)
                .extract().jsonPath().getLong("id");

        // Operation should auto-transition to PENDING_EXTERNAL_APPROVAL
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{id}", operationId)
                .then()
                .statusCode(200)
                .body("status", is("PENDING_EXTERNAL_APPROVAL"));

        // Update permit to approved — should auto-transition back to VALUATION_REVIEW
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"permitType": "FDA", "status": "APROBADO", "referenceNumber": "FDA-BLOCK"}
                        """)
                .when().put("/api/operations/{opId}/valuation/permits/{permitId}", operationId, blockingPermitId)
                .then()
                .statusCode(200);

        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{id}", operationId)
                .then()
                .statusCode(200)
                .body("status", is("VALUATION_REVIEW"));

        // Clean up
        given()
                .auth().basic("admin", "admin123")
                .when().delete("/api/operations/{opId}/valuation/permits/{permitId}", operationId, blockingPermitId)
                .then()
                .statusCode(204);
    }

    // ── GATT Form ────────────────────────────────────────────────────────

    @Test
    @Order(40)
    void testGetGattForm() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{id}/valuation/gatt-form", operationId)
                .then()
                .statusCode(200)
                .body("required", is(true));
    }

    @Test
    @Order(41)
    void testSaveGattForm() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"commercialLinks": false, "commissions": 50.00, "unrecordedTransport": 25.00,
                         "adjustmentAmount": 10.00, "justification": "Standard valuation"}
                        """)
                .when().put("/api/operations/{id}/valuation/gatt-form", operationId)
                .then()
                .statusCode(200)
                .body("commercialLinks", is(false))
                .body("gattMethod", is("GATT_ARTICLE_1"))
                .body("completedAt", notNullValue())
                .body("completedBy", is("admin"));
    }

    @Test
    @Order(42)
    void testClientCannotSaveGattForm() {
        given()
                .auth().basic("client", "client123")
                .contentType(ContentType.JSON)
                .body("""
                        {"commercialLinks": false, "commissions": 0, "unrecordedTransport": 0, "adjustmentAmount": 0, "justification": "Test"}
                        """)
                .when().put("/api/operations/{id}/valuation/gatt-form", operationId)
                .then()
                .statusCode(403);
    }

    // ── Finalize valuation ───────────────────────────────────────────────

    @Test
    @Order(50)
    void testFinalizeValuation() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .when().post("/api/operations/{id}/valuation/finalize", operationId)
                .then()
                .statusCode(200);

        // Operation should advance to PAYMENT_PREPARATION
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{id}", operationId)
                .then()
                .statusCode(200)
                .body("status", is("PAYMENT_PREPARATION"));
    }

    @Test
    @Order(51)
    void testCannotFinalizeNonValuationReviewOperation() {
        // operationId is now at PAYMENT_PREPARATION — finalize should fail
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .when().post("/api/operations/{id}/valuation/finalize", operationId)
                .then()
                .statusCode(400);
    }

    @Test
    @Order(52)
    void testClientCannotFinalizeValuation() {
        // Create a new operation at VALUATION_REVIEW for this test
        var opId = createOperationAtValuationReview();

        given()
                .auth().basic("client", "client123")
                .contentType(ContentType.JSON)
                .when().post("/api/operations/{id}/valuation/finalize", opId)
                .then()
                .statusCode(403);
    }

    // ── GATT not required for EXPRESO ────────────────────────────────────

    @Test
    @Order(60)
    void testGattFormNotRequiredForExpreso() {
        // Create operation at SUBMITTED_TO_CUSTOMS, set EXPRESO (auto-advances to VALUATION_REVIEW)
        var opId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "AIR", "operationCategory": "CATEGORY_1",
                         "blNumber": "BL-VAL-EXPRESO", "blAvailability": "ORIGINAL"}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        uploadAllMandatoryDocs(opId);
        setupDeclarationWithApprovals(opId);

        var statuses = new String[]{
                "DOCUMENTATION_COMPLETE", "IN_REVIEW", "PRELIQUIDATION_REVIEW",
                "ANALYST_ASSIGNED", "DECLARATION_IN_PROGRESS", "SUBMITTED_TO_CUSTOMS"
        };
        for (var status : statuses) {
            advanceToStatus(opId, status);
        }

        // Set EXPRESO — auto-advances to VALUATION_REVIEW
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"inspectionType": "EXPRESO"}
                        """)
                .when().post("/api/operations/{id}/inspection/type", opId)
                .then()
                .statusCode(200);

        // GATT form should NOT be required
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{id}/valuation/gatt-form", opId)
                .then()
                .statusCode(200)
                .body("required", is(false));

        // Saving GATT should fail since not required
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"commercialLinks": false, "commissions": 0, "unrecordedTransport": 0, "adjustmentAmount": 0, "justification": "Test"}
                        """)
                .when().put("/api/operations/{id}/valuation/gatt-form", opId)
                .then()
                .statusCode(400);
    }
}
