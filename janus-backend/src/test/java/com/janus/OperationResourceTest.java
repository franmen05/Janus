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
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class OperationResourceTest {

    private static Long createdOperationId;

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

    private static void uploadAllMandatoryDocs(Long operationId) {
        uploadDocument(operationId, "BL");
        uploadDocument(operationId, "COMMERCIAL_INVOICE");
        uploadDocument(operationId, "PACKING_LIST");
    }

    private static void setInspectionType(Long operationId) {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"inspectionType": "VISUAL"}
                        """)
                .when().post("/api/operations/{id}/inspection/type", operationId)
                .then()
                .statusCode(200);
    }

    private static void setupDeclarationWithApprovals(Long operationId) {
        var declId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"declarationNumber": "PRELIM-OP-TEST", "fobValue": 1000.00, "cifValue": 1200.00,
                         "taxableBase": 1200.00, "totalTaxes": 180.00, "freightValue": 150.00, "insuranceValue": 50.00}
                        """)
                .when().post("/api/operations/{opId}/declarations/preliminary", operationId)
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"comment": "Technical OK"}
                        """)
                .when().post("/api/operations/{opId}/declarations/{id}/approve-technical", operationId, declId)
                .then().statusCode(200);

        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"comment": "Final OK"}
                        """)
                .when().post("/api/operations/{opId}/declarations/{id}/approve-final", operationId, declId)
                .then().statusCode(200);
    }

    // ---- Auth tests ----

    @Test
    @Order(1)
    void testListRequiresAuth() {
        given()
                .when().get("/api/operations")
                .then()
                .statusCode(401);
    }

    @Test
    @Order(2)
    void testCarrierCannotListOperations() {
        given()
                .auth().basic("carrier", "carrier123")
                .when().get("/api/operations")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(3)
    void testClientCannotCreateOperation() {
        given()
                .auth().basic("client", "client123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-TEST-001", "blOriginalAvailable": true}
                        """)
                .when().post("/api/operations")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(4)
    void testAccountingCannotCreateOperation() {
        given()
                .auth().basic("accounting", "acc123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-TEST-001", "blOriginalAvailable": true}
                        """)
                .when().post("/api/operations")
                .then()
                .statusCode(403);
    }

    // ---- CRUD tests ----

    @Test
    @Order(10)
    void testCreateOperation() {
        createdOperationId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-TEST-001", "blOriginalAvailable": true, "notes": "Test operation"}
                        """)
                .when().post("/api/operations")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("referenceNumber", notNullValue())
                .body("status", is("DRAFT"))
                .body("transportMode", is("AIR"))
                .body("operationCategory", is("CATEGORY_1"))
                .body("notes", is("Test operation"))
                .extract().jsonPath().getLong("id");
    }

    @Test
    @Order(11)
    void testGetOperationById() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{id}", createdOperationId)
                .then()
                .statusCode(200)
                .body("id", is(createdOperationId.intValue()))
                .body("status", is("DRAFT"));
    }

    @Test
    @Order(12)
    void testListAllOperations() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations")
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1));
    }

    @Test
    @Order(13)
    void testUpdateOperation() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "AIR", "operationCategory": "CATEGORY_3", "blNumber": "BL-TEST-001", "blOriginalAvailable": true, "notes": "Updated notes"}
                        """)
                .when().put("/api/operations/{id}", createdOperationId)
                .then()
                .statusCode(200)
                .body("transportMode", is("AIR"))
                .body("operationCategory", is("CATEGORY_3"))
                .body("notes", is("Updated notes"));
    }

    @Test
    @Order(14)
    void testFilterByStatus() {
        given()
                .auth().basic("admin", "admin123")
                .queryParam("status", "DRAFT")
                .when().get("/api/operations")
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1));
    }

    @Test
    @Order(15)
    void testFilterByClientId() {
        given()
                .auth().basic("admin", "admin123")
                .queryParam("clientId", 1)
                .when().get("/api/operations")
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1));
    }

    @Test
    @Order(16)
    void testAgentCanCreateOperation() {
        given()
                .auth().basic("agent", "agent123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 2, "transportMode": "AIR", "operationCategory": "CATEGORY_2", "blNumber": "BL-TEST-002", "blOriginalAvailable": true}
                        """)
                .when().post("/api/operations")
                .then()
                .statusCode(201)
                .body("status", is("DRAFT"));
    }

    @Test
    @Order(17)
    void testGetNonExistentOperation() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/99999")
                .then()
                .statusCode(404)
                .body("error", containsString("not found"));
    }

    // ---- Status transition tests ----

    @Test
    @Order(20)
    void testValidStatusTransition() {
        // Upload mandatory docs before transitioning to DOCUMENTATION_COMPLETE
        uploadAllMandatoryDocs(createdOperationId);

        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"newStatus": "DOCUMENTATION_COMPLETE"}
                        """)
                .when().post("/api/operations/{id}/change-status", createdOperationId)
                .then()
                .statusCode(200);

        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{id}", createdOperationId)
                .then()
                .statusCode(200)
                .body("status", is("DOCUMENTATION_COMPLETE"));
    }

    @Test
    @Order(21)
    void testInvalidStatusTransition() {
        // createdOperationId is now DOCUMENTATION_COMPLETE (from testValidStatusTransition)
        // DOCUMENTATION_COMPLETE can only go to IN_REVIEW or CANCELLED, not CLOSED
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"newStatus": "CLOSED"}
                        """)
                .when().post("/api/operations/{id}/change-status", createdOperationId)
                .then()
                .statusCode(400)
                .body("error", containsString("Invalid status transition"));
    }

    @Test
    @Order(22)
    void testClosedSetsClosedAt() {
        // Create AIR/CATEGORY_1 operation (simpler compliance path)
        var opId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-TEST-001", "blOriginalAvailable": true}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // Upload mandatory docs
        uploadAllMandatoryDocs(opId);

        // Setup declaration with approvals for review compliance rules
        setupDeclarationWithApprovals(opId);

        // DRAFT → DOCUMENTATION_COMPLETE
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"newStatus": "DOCUMENTATION_COMPLETE"}
                        """)
                .when().post("/api/operations/{id}/change-status", opId)
                .then().statusCode(200);

        // Remaining transitions through new review flow
        var remaining = new String[]{
                "IN_REVIEW", "PRELIQUIDATION_REVIEW", "ANALYST_ASSIGNED",
                "DECLARATION_IN_PROGRESS", "SUBMITTED_TO_CUSTOMS",
                "VALUATION_REVIEW", "PAYMENT_PREPARATION", "IN_TRANSIT", "CLOSED"
        };
        for (var status : remaining) {
            // Set inspection type before VALUATION_REVIEW transition
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

        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{id}", opId)
                .then()
                .statusCode(200)
                .body("status", is("CLOSED"))
                .body("closedAt", notNullValue());
    }

    @Test
    @Order(23)
    void testUpdateClosedOperationForbidden() {
        // Create a fresh operation
        var opId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-TEST-CLOSED", "blOriginalAvailable": true}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // Upload mandatory docs
        uploadAllMandatoryDocs(opId);

        // Setup declaration with approvals for compliance rules
        setupDeclarationWithApprovals(opId);

        // Advance through all statuses to CLOSED
        var statuses = new String[]{
                "DOCUMENTATION_COMPLETE", "IN_REVIEW", "PRELIQUIDATION_REVIEW",
                "ANALYST_ASSIGNED", "DECLARATION_IN_PROGRESS", "SUBMITTED_TO_CUSTOMS",
                "VALUATION_REVIEW", "PAYMENT_PREPARATION", "IN_TRANSIT", "CLOSED"
        };
        for (var status : statuses) {
            // Set inspection type before VALUATION_REVIEW transition
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
                    .then().statusCode(200);
        }

        // Attempt to update the CLOSED operation — should fail
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-UPDATED", "blOriginalAvailable": true, "notes": "Should not work"}
                        """)
                .when().put("/api/operations/{id}", opId)
                .then()
                .statusCode(400)
                .body("error", containsString("Cannot update a closed or cancelled operation"));
    }

    // ---- Delete tests ----

    @Test
    @Order(30)
    void testDeleteDraftOperation() {
        var draftId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "MARITIME", "operationCategory": "CATEGORY_1", "containerNumber": "CONT-001", "blNumber": "BL-TEST-001", "blOriginalAvailable": true}
                        """)
                .when().post("/api/operations")
                .then()
                .statusCode(201)
                .extract().jsonPath().getLong("id");

        given()
                .auth().basic("admin", "admin123")
                .when().delete("/api/operations/{id}", draftId)
                .then()
                .statusCode(204);
    }

    @Test
    @Order(31)
    void testDeleteNonDraftForbidden() {
        given()
                .auth().basic("admin", "admin123")
                .when().delete("/api/operations/{id}", createdOperationId)
                .then()
                .statusCode(400)
                .body("error", containsString("not in DRAFT"));
    }

    @Test
    @Order(32)
    void testDeleteNonExistent() {
        given()
                .auth().basic("admin", "admin123")
                .when().delete("/api/operations/99999")
                .then()
                .statusCode(404);
    }

    @Test
    @Order(33)
    void testNonAdminCannotDelete() {
        given()
                .auth().basic("agent", "agent123")
                .when().delete("/api/operations/{id}", createdOperationId)
                .then()
                .statusCode(403);
    }

    // ---- History tests ----

    @Test
    @Order(40)
    void testGetHistory() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{id}/history", createdOperationId)
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1));
    }

    @Test
    @Order(41)
    void testHistoryContainsStatusChange() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{id}/history", createdOperationId)
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(2));
    }

    // ---- Role-based read access ----

    @Test
    @Order(50)
    void testAccountingCanListOperations() {
        given()
                .auth().basic("accounting", "acc123")
                .when().get("/api/operations")
                .then()
                .statusCode(200);
    }

    @Test
    @Order(51)
    void testClientCanListOperations() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations")
                .then()
                .statusCode(200);
    }
}
