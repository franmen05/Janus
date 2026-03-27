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
                        {"clientId": 1, "operationType": "IMPORT", "transportMode": "MARITIME", "operationCategory": "CATEGORY_1", "containerNumber": "CONT-001", "blNumber": "BL-TEST-001", "estimatedArrival": "2025-12-01T10:00:00", "blAvailability": "ORIGINAL", "arrivalPortId": 1}
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

    private static Long setupPreliminaryWithApprovals(Long opId) {
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

    private static void approveFinalDeclaration(Long opId, Long declId) {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"comment": "Final OK"}
                        """)
                .when().post("/api/operations/{opId}/declarations/{id}/approve-final", opId, declId)
                .then().statusCode(200);
    }

    private static void completeLiquidationLifecycle(Long opId) {
        // Generate liquidation
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"agencyServiceFee": 100.00}
                        """)
                .when().post("/api/operations/{opId}/liquidation", opId)
                .then().statusCode(201);

        // Approve liquidation
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"comment": "Approved for test"}
                        """)
                .when().post("/api/operations/{opId}/liquidation/approve", opId)
                .then().statusCode(200);

        // Make definitive
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"dgaPaymentCode": "DGA-TEST-001"}
                        """)
                .when().post("/api/operations/{opId}/liquidation/definitive", opId)
                .then().statusCode(200);

        // Register payment
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"amount": 1000.00, "paymentMethod": "BANK_TRANSFER", "paymentDate": "2025-12-01", "dgaReference": "DGA-REF-001", "bankReference": "BANK-REF-001", "notes": "Test payment"}
                        """)
                .when().post("/api/operations/{opId}/liquidation/payment", opId)
                .then().statusCode(201);
    }

    private static void registerFinalDeclarationAndCrossing(Long opId) {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"declarationNumber": "FINAL-DOC-TEST", "fobValue": 1000.00, "cifValue": 1200.00,
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

    private static void advanceToSubmittedToCustoms(Long opId, Long declId) {
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
                    .when().post("/api/operations/{id}/change-status", opId)
                    .then().statusCode(200);
        }

        // Final approve (auto-advances from PRELIQUIDATION_REVIEW to DECLARATION_IN_PROGRESS)
        approveFinalDeclaration(opId, declId);

        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"newStatus": "SUBMITTED_TO_CUSTOMS"}
                        """)
                .when().post("/api/operations/{id}/change-status", opId)
                .then().statusCode(200);

        // Register final declaration and crossing at SUBMITTED_TO_CUSTOMS
        registerFinalDeclarationAndCrossing(opId);
    }

    @Test
    @Order(31)
    void testSetupCreateAndCloseOperation() {
        closedOperationId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "operationType": "IMPORT", "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-TEST-001", "estimatedArrival": "2025-12-01T10:00:00", "blAvailability": "ORIGINAL", "incoterm": "FOB", "arrivalPortId": 1}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // Upload mandatory docs for compliance
        uploadDoc(closedOperationId, "BL");
        uploadDoc(closedOperationId, "COMMERCIAL_INVOICE");
        uploadDoc(closedOperationId, "PACKING_LIST");

        // Setup preliminary declaration with technical approval
        var declId = setupPreliminaryWithApprovals(closedOperationId);

        // Advance to SUBMITTED_TO_CUSTOMS (includes final approve + final declaration)
        advanceToSubmittedToCustoms(closedOperationId, declId);

        // Set inspection type before VALUATION_REVIEW
        setInspectionType(closedOperationId);

        var transitions = new String[]{
                "VALUATION_REVIEW", "PAYMENT_PREPARATION", "IN_TRANSIT", "CLOSED"
        };
        for (var status : transitions) {
            if ("CLOSED".equals(status)) {
                uploadDoc(closedOperationId, "RECEPTION_RECEIPT");
            }
            if ("IN_TRANSIT".equals(status)) {
                completeLiquidationLifecycle(closedOperationId);
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
        // Create operation and advance to PAYMENT_PREPARATION
        var opId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "operationType": "IMPORT", "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-TEST-001", "estimatedArrival": "2025-12-01T10:00:00", "blAvailability": "ORIGINAL", "incoterm": "FOB", "arrivalPortId": 1}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // Upload mandatory docs before advancing
        uploadDoc(opId, "BL");
        uploadDoc(opId, "COMMERCIAL_INVOICE");
        uploadDoc(opId, "PACKING_LIST");

        // Setup preliminary declaration with technical approval
        var declId = setupPreliminaryWithApprovals(opId);

        // Advance to SUBMITTED_TO_CUSTOMS (includes final approve + final declaration)
        advanceToSubmittedToCustoms(opId, declId);

        // Set inspection type before VALUATION_REVIEW
        setInspectionType(opId);

        // Advance to PAYMENT_PREPARATION
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"newStatus": "VALUATION_REVIEW"}
                        """)
                .when().post("/api/operations/{id}/change-status", opId)
                .then().statusCode(200);

        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"newStatus": "PAYMENT_PREPARATION"}
                        """)
                .when().post("/api/operations/{id}/change-status", opId)
                .then().statusCode(200);

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
        // Create operation and advance to VALUATION_REVIEW
        var opId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "operationType": "IMPORT", "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-TEST-001", "estimatedArrival": "2025-12-01T10:00:00", "blAvailability": "ORIGINAL", "arrivalPortId": 1}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // Upload mandatory docs before advancing
        uploadDoc(opId, "BL");
        uploadDoc(opId, "COMMERCIAL_INVOICE");
        uploadDoc(opId, "PACKING_LIST");

        // Setup preliminary declaration with technical approval
        var declId = setupPreliminaryWithApprovals(opId);

        // Advance to SUBMITTED_TO_CUSTOMS (includes final approve + final declaration)
        advanceToSubmittedToCustoms(opId, declId);

        // Set inspection type and advance to VALUATION_REVIEW
        setInspectionType(opId);
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"newStatus": "VALUATION_REVIEW"}
                        """)
                .when().post("/api/operations/{id}/change-status", opId)
                .then().statusCode(200);

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

    // ---- RECEPTION_RECEIPT document type tests ----

    private static Long inTransitOperationId;
    private static Long receptionReceiptDocId;

    @Test
    @Order(50)
    void testSetupInTransitOperation() {
        // Create an operation and advance it to IN_TRANSIT for RECEPTION_RECEIPT tests
        inTransitOperationId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "operationType": "IMPORT", "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-RR-TEST", "estimatedArrival": "2025-12-01T10:00:00", "blAvailability": "ORIGINAL", "incoterm": "FOB", "arrivalPortId": 1}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        uploadDoc(inTransitOperationId, "BL");
        uploadDoc(inTransitOperationId, "COMMERCIAL_INVOICE");
        uploadDoc(inTransitOperationId, "PACKING_LIST");

        var declId = setupPreliminaryWithApprovals(inTransitOperationId);

        // Advance to SUBMITTED_TO_CUSTOMS (includes final approve + final declaration)
        advanceToSubmittedToCustoms(inTransitOperationId, declId);

        // Set inspection type before VALUATION_REVIEW
        setInspectionType(inTransitOperationId);

        var transitions = new String[]{
                "VALUATION_REVIEW", "PAYMENT_PREPARATION", "IN_TRANSIT"
        };
        for (var status : transitions) {
            given()
                    .auth().basic("admin", "admin123")
                    .contentType(ContentType.JSON)
                    .body("""
                            {"newStatus": "%s"}
                            """.formatted(status))
                    .when().post("/api/operations/{id}/change-status", inTransitOperationId)
                    .then()
                    .statusCode(200);
        }
    }

    @Test
    @Order(51)
    void testUploadReceptionReceipt() {
        receptionReceiptDocId = given()
                .auth().preemptive().basic("admin", "admin123")
                .multiPart("file", "reception-receipt.pdf", "dummy receipt content".getBytes(), "application/pdf")
                .multiPart("documentType", "RECEPTION_RECEIPT")
                .when().post("/api/operations/{operationId}/documents", inTransitOperationId)
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("documentType", is("RECEPTION_RECEIPT"))
                .body("operationId", is(inTransitOperationId.intValue()))
                .extract().jsonPath().getLong("id");
    }

    @Test
    @Order(52)
    void testReceptionReceiptAppearsInDocumentList() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{operationId}/documents", inTransitOperationId)
                .then()
                .statusCode(200)
                .body("find { it.documentType == 'RECEPTION_RECEIPT' }.id", is(receptionReceiptDocId.intValue()));
    }

    @Test
    @Order(53)
    void testDownloadReceptionReceipt() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{operationId}/documents/{id}/download", inTransitOperationId, receptionReceiptDocId)
                .then()
                .statusCode(200)
                .header("Content-Disposition", containsString("reception-receipt.pdf"));
    }
}
