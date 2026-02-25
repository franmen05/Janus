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
import static org.hamcrest.CoreMatchers.anyOf;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class DocumentResourceTest {

    private static Long operationId;
    private static Long documentId;
    private static Long closedOperationId;

    // ---- Setup: create an operation for document tests ----

    @Test
    @Order(1)
    void testSetupCreateOperation() {
        operationId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "MARITIME", "operationCategory": "CATEGORY_1", "containerNumber": "CONT-001", "blNumber": "BL-TEST-001", "blAvailability": "ORIGINAL"}
                        """)
                .when().post("/api/operations")
                .then()
                .statusCode(201)
                .extract().jsonPath().getLong("id");
    }

    // ---- Upload tests ----

    @Test
    @Order(10)
    void testUploadDocument() {
        documentId = given()
                .auth().preemptive().basic("admin", "admin123")
                .multiPart("file", "test-invoice.pdf", "dummy pdf content".getBytes(), "application/pdf")
                .multiPart("documentType", "BL")
                .when().post("/api/operations/{operationId}/documents", operationId)
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("documentType", is("BL"))
                .body("operationId", is(operationId.intValue()))
                .extract().jsonPath().getLong("id");
    }

    @Test
    @Order(11)
    void testListDocuments() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{operationId}/documents", operationId)
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1));
    }

    @Test
    @Order(12)
    void testGetDocumentById() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{operationId}/documents/{id}", operationId, documentId)
                .then()
                .statusCode(200)
                .body("id", is(documentId.intValue()))
                .body("documentType", is("BL"));
    }

    @Test
    @Order(13)
    void testGetVersions() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{operationId}/documents/{id}/versions", operationId, documentId)
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1))
                .body("[0].versionNumber", is(1))
                .body("[0].originalName", is("test-invoice.pdf"));
    }

    @Test
    @Order(14)
    void testDownloadLatestVersion() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{operationId}/documents/{id}/download", operationId, documentId)
                .then()
                .statusCode(200)
                .header("Content-Disposition", containsString("test-invoice.pdf"));
    }

    @Test
    @Order(15)
    void testGetCompleteness() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{operationId}/documents/completeness", operationId)
                .then()
                .statusCode(200)
                .body("percentage", notNullValue());
    }

    // ---- Auth tests ----

    @Test
    @Order(20)
    void testListDocumentsRequiresAuth() {
        given()
                .when().get("/api/operations/{operationId}/documents", operationId)
                .then()
                .statusCode(401);
    }

    @Test
    @Order(21)
    void testClientCannotUpload() {
        given()
                .auth().preemptive().basic("client", "client123")
                .multiPart("file", "blocked.pdf", "content".getBytes(), "application/pdf")
                .multiPart("documentType", "BL")
                .when().post("/api/operations/{operationId}/documents", operationId)
                .then()
                .statusCode(403);
    }

    @Test
    @Order(22)
    void testAccountingCannotUpload() {
        given()
                .auth().preemptive().basic("accounting", "acc123")
                .multiPart("file", "blocked.pdf", "content".getBytes(), "application/pdf")
                .multiPart("documentType", "BL")
                .when().post("/api/operations/{operationId}/documents", operationId)
                .then()
                .statusCode(403);
    }

    // ---- Edge cases ----

    @Test
    @Order(30)
    void testUploadToNonExistentOperation() {
        given()
                .auth().preemptive().basic("admin", "admin123")
                .multiPart("file", "orphan.pdf", "content".getBytes(), "application/pdf")
                .multiPart("documentType", "BL")
                .when().post("/api/operations/99999/documents")
                .then()
                .statusCode(404);
    }

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

    private static void uploadDoc(Long opId, String docType) {
        given()
                .auth().basic("admin", "admin123")
                .multiPart("file", createTempPdf(), "application/pdf")
                .multiPart("documentType", docType)
                .when().post("/api/operations/{opId}/documents", opId)
                .then()
                .statusCode(201);
    }

    private static void completeGattForm(Long opId) {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"commercialLinks": false, "commissions": 0, "unrecordedTransport": 0, "adjustmentAmount": 0, "justification": "Test"}
                        """)
                .when().put("/api/operations/{opId}/valuation/gatt-form", opId)
                .then()
                .statusCode(200);
    }

    private static void setupDeclarationWithApprovals(Long opId) {
        // Create a preliminary declaration
        var declId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"declarationNumber": "PRELIM-DOC-TEST", "fobValue": 1000.00, "cifValue": 1200.00,
                         "taxableBase": 1200.00, "totalTaxes": 180.00, "freightValue": 150.00, "insuranceValue": 50.00}
                        """)
                .when().post("/api/operations/{opId}/declarations/preliminary", opId)
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // Technical approval
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"comment": "Technical OK"}
                        """)
                .when().post("/api/operations/{opId}/declarations/{id}/approve-technical", opId, declId)
                .then().statusCode(200);

        // Final approval
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"comment": "Final OK"}
                        """)
                .when().post("/api/operations/{opId}/declarations/{id}/approve-final", opId, declId)
                .then().statusCode(200);
    }

    @Test
    @Order(31)
    void testSetupCreateAndCloseOperation() {
        closedOperationId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-TEST-001", "blAvailability": "ORIGINAL"}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // Upload mandatory docs for compliance
        uploadDoc(closedOperationId, "BL");
        uploadDoc(closedOperationId, "COMMERCIAL_INVOICE");
        uploadDoc(closedOperationId, "PACKING_LIST");

        // Setup declaration with approvals for review compliance rules
        setupDeclarationWithApprovals(closedOperationId);

        var transitions = new String[]{
                "DOCUMENTATION_COMPLETE", "IN_REVIEW", "PRELIQUIDATION_REVIEW", "ANALYST_ASSIGNED",
                "DECLARATION_IN_PROGRESS", "SUBMITTED_TO_CUSTOMS",
                "VALUATION_REVIEW", "PAYMENT_PREPARATION", "IN_TRANSIT", "CLOSED"
        };
        for (var status : transitions) {
            if ("VALUATION_REVIEW".equals(status)) {
                setInspectionType(closedOperationId);
            }
            if ("PAYMENT_PREPARATION".equals(status)) {
                completeGattForm(closedOperationId);
            }
            given()
                    .auth().basic("admin", "admin123")
                    .contentType(ContentType.JSON)
                    .body("""
                            {"newStatus": "%s"}
                            """.formatted(status))
                    .when().post("/api/operations/{id}/change-status", closedOperationId)
                    .then()
                    .statusCode(200);
        }
    }

    @Test
    @Order(32)
    void testUploadToClosedOperation() {
        // After removing status-based upload restriction, ADMIN/AGENT can upload in any status
        given()
                .auth().preemptive().basic("admin", "admin123")
                .multiPart("file", "late.pdf", "content".getBytes(), "application/pdf")
                .multiPart("documentType", "BL")
                .when().post("/api/operations/{operationId}/documents", closedOperationId)
                .then()
                .statusCode(anyOf(is(200), is(201)));
    }

    @Test
    @Order(33)
    void testUploadBlockedAfterValuationReview() {
        // Create operation and advance to PAYMENT_PREPARATION (use LCL to avoid FCL-specific rules)
        var opId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-TEST-001", "blAvailability": "ORIGINAL"}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // Upload mandatory docs before advancing
        uploadDoc(opId, "BL");
        uploadDoc(opId, "COMMERCIAL_INVOICE");
        uploadDoc(opId, "PACKING_LIST");

        // Setup declaration with approvals for review compliance rules
        setupDeclarationWithApprovals(opId);

        // Advance to PAYMENT_PREPARATION (past VALUATION_REVIEW)
        var transitions = new String[]{
                "DOCUMENTATION_COMPLETE", "IN_REVIEW", "PRELIQUIDATION_REVIEW", "ANALYST_ASSIGNED",
                "DECLARATION_IN_PROGRESS", "SUBMITTED_TO_CUSTOMS",
                "VALUATION_REVIEW", "PAYMENT_PREPARATION"
        };
        for (var status : transitions) {
            if ("VALUATION_REVIEW".equals(status)) {
                setInspectionType(opId);
            }
            if ("PAYMENT_PREPARATION".equals(status)) {
                completeGattForm(opId);
            }
            given()
                    .auth().basic("admin", "admin123")
                    .contentType(ContentType.JSON)
                    .body("""
                            {"newStatus": "%s"}
                            """.formatted(status))
                    .when().post("/api/operations/{id}/change-status", opId)
                    .then()
                    .statusCode(200);
        }

        // After removing status-based upload restriction, upload succeeds in any status
        given()
                .auth().preemptive().basic("admin", "admin123")
                .multiPart("file", "blocked.pdf", "content".getBytes(), "application/pdf")
                .multiPart("documentType", "BL")
                .when().post("/api/operations/{operationId}/documents", opId)
                .then()
                .statusCode(anyOf(is(200), is(201)));
    }

    @Test
    @Order(34)
    void testDeleteDocumentFromClosedOperationBlocked() {
        // Get a document from the closed operation
        var closedDocId = given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{operationId}/documents", closedOperationId)
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1))
                .extract().jsonPath().getLong("[0].id");

        // Attempt to delete — should be blocked because operation is CLOSED
        given()
                .auth().basic("admin", "admin123")
                .when().delete("/api/operations/{operationId}/documents/{id}", closedOperationId, closedDocId)
                .then()
                .statusCode(400)
                .body("error", containsString("closed or cancelled"));
    }

    @Test
    @Order(35)
    void testUploadAllowedAtValuationReview() {
        // Create operation and advance to VALUATION_REVIEW (use LCL to avoid FCL-specific rules)
        var opId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-TEST-001", "blAvailability": "ORIGINAL"}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // Upload mandatory docs before advancing
        uploadDoc(opId, "BL");
        uploadDoc(opId, "COMMERCIAL_INVOICE");
        uploadDoc(opId, "PACKING_LIST");

        // Setup declaration with approvals for review compliance rules
        setupDeclarationWithApprovals(opId);

        // Advance to VALUATION_REVIEW
        var transitions = new String[]{
                "DOCUMENTATION_COMPLETE", "IN_REVIEW", "PRELIQUIDATION_REVIEW", "ANALYST_ASSIGNED",
                "DECLARATION_IN_PROGRESS", "SUBMITTED_TO_CUSTOMS",
                "VALUATION_REVIEW"
        };
        for (var status : transitions) {
            if ("VALUATION_REVIEW".equals(status)) {
                setInspectionType(opId);
            }
            given()
                    .auth().basic("admin", "admin123")
                    .contentType(ContentType.JSON)
                    .body("""
                            {"newStatus": "%s"}
                            """.formatted(status))
                    .when().post("/api/operations/{id}/change-status", opId)
                    .then()
                    .statusCode(200);
        }

        // Upload should still be allowed at VALUATION_REVIEW
        given()
                .auth().preemptive().basic("admin", "admin123")
                .multiPart("file", "allowed.pdf", "content".getBytes(), "application/pdf")
                .multiPart("documentType", "OTHER")
                .when().post("/api/operations/{operationId}/documents", opId)
                .then()
                .statusCode(201);
    }

    // ---- Delete tests ----

    @Test
    @Order(40)
    void testAccountingCannotDelete() {
        given()
                .auth().basic("accounting", "acc123")
                .when().delete("/api/operations/{operationId}/documents/{id}", operationId, documentId)
                .then()
                .statusCode(403);
    }

    @Test
    @Order(41)
    void testSoftDelete() {
        given()
                .auth().basic("admin", "admin123")
                .when().delete("/api/operations/{operationId}/documents/{id}", operationId, documentId)
                .then()
                .statusCode(204);
    }

    @Test
    @Order(42)
    void testGetDeletedDocumentReturns404() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{operationId}/documents/{id}", operationId, documentId)
                .then()
                .statusCode(404);
    }

    @Test
    @Order(43)
    void testAdminSeesDeletedDocumentsWithIncludeDeleted() {
        given()
                .auth().basic("admin", "admin123")
                .queryParam("includeDeleted", true)
                .when().get("/api/operations/{operationId}/documents", operationId)
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1))
                .body("find { it.id == " + documentId + " }.active", is(false));
    }

    @Test
    @Order(44)
    void testNonAdminIncludeDeletedIgnored() {
        given()
                .auth().basic("agent", "agent123")
                .queryParam("includeDeleted", true)
                .when().get("/api/operations/{operationId}/documents", operationId)
                .then()
                .statusCode(200)
                .body("findAll { it.active == false }.size()", is(0));
    }

    @Test
    @Order(45)
    void testAdminCanDownloadDeletedDocument() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{operationId}/documents/{id}/download", operationId, documentId)
                .then()
                .statusCode(200)
                .header("Content-Disposition", containsString("test-invoice.pdf"));
    }

    @Test
    @Order(46)
    void testAdminCanListVersionsOfDeletedDocument() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{operationId}/documents/{id}/versions", operationId, documentId)
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1))
                .body("[0].versionNumber", is(1));
    }

    @Test
    @Order(47)
    void testAdminCanDownloadVersionOfDeletedDocument() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{operationId}/documents/{id}/versions/{v}/download", operationId, documentId, 1)
                .then()
                .statusCode(200)
                .header("Content-Disposition", containsString("test-invoice.pdf"));
    }

    @Test
    @Order(48)
    void testNonAdminCannotListVersionsOfDeletedDocument() {
        given()
                .auth().basic("agent", "agent123")
                .when().get("/api/operations/{operationId}/documents/{id}/versions", operationId, documentId)
                .then()
                .statusCode(404);
    }
}
