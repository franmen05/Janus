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
class InspectionResourceTest {

    private static Long operationId;
    private static Long expenseId;
    private static Long photoId;

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

    private static File createTempImage() {
        try {
            var tempFile = File.createTempFile("test-photo", ".jpg");
            tempFile.deleteOnExit();
            // Write minimal JPEG header bytes
            Files.write(tempFile.toPath(), new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0, 0, 0});
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
                        {"declarationNumber": "PRELIM-INSP-TEST", "fobValue": 1000.00, "cifValue": 1200.00,
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
     * Creates an operation and advances it to SUBMITTED_TO_CUSTOMS.
     */
    private static Long createOperationAtSubmittedToCustoms() {
        var opId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "AIR", "operationCategory": "CATEGORY_1",
                         "blNumber": "BL-INSP-TEST", "blAvailability": "ORIGINAL"}
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

        return opId;
    }

    // ── Setup: create operation at SUBMITTED_TO_CUSTOMS ──────────────────

    @Test
    @Order(1)
    void testSetupOperation() {
        operationId = createOperationAtSubmittedToCustoms();

        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{id}", operationId)
                .then()
                .statusCode(200)
                .body("status", is("SUBMITTED_TO_CUSTOMS"));
    }

    // ── Set inspection type ──────────────────────────────────────────────

    @Test
    @Order(10)
    void testSetInspectionType() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"inspectionType": "VISUAL"}
                        """)
                .when().post("/api/operations/{id}/inspection/type", operationId)
                .then()
                .statusCode(200);

        // Verify inspection type was set on operation
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{id}", operationId)
                .then()
                .statusCode(200)
                .body("inspectionType", is("VISUAL"));
    }

    @Test
    @Order(11)
    void testClientCannotSetInspectionType() {
        given()
                .auth().basic("client", "client123")
                .contentType(ContentType.JSON)
                .body("""
                        {"inspectionType": "FISICA"}
                        """)
                .when().post("/api/operations/{id}/inspection/type", operationId)
                .then()
                .statusCode(403);
    }

    // ── Expense CRUD ─────────────────────────────────────────────────────

    @Test
    @Order(20)
    void testAddExpense() {
        expenseId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"category": "LABOR", "description": "Inspector fee", "amount": 250.00, "currency": "USD", "justification": "Routine inspection"}
                        """)
                .when().post("/api/operations/{id}/inspection/expenses", operationId)
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("category", is("LABOR"))
                .body("amount", is(250.00f))
                .body("currency", is("USD"))
                .extract().jsonPath().getLong("id");
    }

    @Test
    @Order(21)
    void testListExpenses() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{id}/inspection/expenses", operationId)
                .then()
                .statusCode(200)
                .body("expenses.size()", greaterThanOrEqualTo(1))
                .body("total", notNullValue());
    }

    @Test
    @Order(22)
    void testAccountingCanListExpenses() {
        given()
                .auth().basic("accounting", "acc123")
                .when().get("/api/operations/{id}/inspection/expenses", operationId)
                .then()
                .statusCode(200);
    }

    @Test
    @Order(23)
    void testUpdateExpense() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"category": "EQUIPMENT", "description": "Updated equipment fee", "amount": 300.00, "currency": "USD", "justification": "Updated justification"}
                        """)
                .when().put("/api/operations/{opId}/inspection/expenses/{expenseId}", operationId, expenseId)
                .then()
                .statusCode(200)
                .body("category", is("EQUIPMENT"))
                .body("amount", is(300.00f))
                .body("description", is("Updated equipment fee"));
    }

    @Test
    @Order(24)
    void testDeleteExpense() {
        given()
                .auth().basic("admin", "admin123")
                .when().delete("/api/operations/{opId}/inspection/expenses/{expenseId}", operationId, expenseId)
                .then()
                .statusCode(204);
    }

    @Test
    @Order(25)
    void testClientCannotAddExpense() {
        given()
                .auth().basic("client", "client123")
                .contentType(ContentType.JSON)
                .body("""
                        {"category": "LABOR", "description": "Should fail", "amount": 100.00}
                        """)
                .when().post("/api/operations/{id}/inspection/expenses", operationId)
                .then()
                .statusCode(403);
    }

    // ── Photo upload & list ──────────────────────────────────────────────

    @Test
    @Order(30)
    void testUploadPhoto() {
        photoId = given()
                .auth().basic("admin", "admin123")
                .multiPart("file", createTempImage(), "image/jpeg")
                .multiPart("caption", "Front view of cargo")
                .when().post("/api/operations/{id}/inspection/photos", operationId)
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("originalName", notNullValue())
                .body("caption", is("Front view of cargo"))
                .extract().jsonPath().getLong("id");
    }

    @Test
    @Order(31)
    void testListPhotos() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{id}/inspection/photos", operationId)
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1));
    }

    @Test
    @Order(32)
    void testClientCanListPhotos() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{id}/inspection/photos", operationId)
                .then()
                .statusCode(200);
    }

    @Test
    @Order(33)
    void testClientCannotUploadPhoto() {
        given()
                .auth().basic("client", "client123")
                .multiPart("file", createTempImage(), "image/jpeg")
                .multiPart("caption", "Should fail")
                .when().post("/api/operations/{id}/inspection/photos", operationId)
                .then()
                .statusCode(403);
    }

    @Test
    @Order(34)
    void testDownloadPhoto() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{opId}/inspection/photos/{photoId}/download", operationId, photoId)
                .then()
                .statusCode(200);
    }

    // ── Inspection type validation ───────────────────────────────────────

    @Test
    @Order(40)
    void testCannotSetInspectionTypeOnDraftOperation() {
        // Create a new operation in DRAFT status
        var draftId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "AIR", "operationCategory": "CATEGORY_1",
                         "blNumber": "BL-INSP-DRAFT", "blAvailability": "ORIGINAL"}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"inspectionType": "VISUAL"}
                        """)
                .when().post("/api/operations/{id}/inspection/type", draftId)
                .then()
                .statusCode(400);
    }

    @Test
    @Order(41)
    void testExpresoInspectionCannotUploadPhotos() {
        // Create a fresh operation at SUBMITTED_TO_CUSTOMS
        var opId = createOperationAtSubmittedToCustoms();

        // Set EXPRESO inspection type (this auto-advances to VALUATION_REVIEW)
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"inspectionType": "EXPRESO"}
                        """)
                .when().post("/api/operations/{id}/inspection/type", opId)
                .then()
                .statusCode(200);

        // Attempt to upload photo — should fail for EXPRESO
        given()
                .auth().basic("admin", "admin123")
                .multiPart("file", createTempImage(), "image/jpeg")
                .multiPart("caption", "Should fail for EXPRESO")
                .when().post("/api/operations/{id}/inspection/photos", opId)
                .then()
                .statusCode(400);
    }
}
