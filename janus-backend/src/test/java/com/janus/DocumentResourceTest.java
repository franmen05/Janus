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
                        {"clientId": 1, "cargoType": "FCL", "inspectionType": "EXPRESS"}
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

    @Test
    @Order(31)
    void testSetupCreateAndCloseOperation() {
        closedOperationId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "cargoType": "FCL", "inspectionType": "EXPRESS"}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        var transitions = new String[]{
                "DOCUMENTATION_COMPLETE", "DECLARATION_IN_PROGRESS", "SUBMITTED_TO_CUSTOMS",
                "VALUATION_REVIEW", "PAYMENT_PREPARATION", "IN_TRANSIT", "CLOSED"
        };
        for (var status : transitions) {
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
        given()
                .auth().preemptive().basic("admin", "admin123")
                .multiPart("file", "late.pdf", "content".getBytes(), "application/pdf")
                .multiPart("documentType", "BL")
                .when().post("/api/operations/{operationId}/documents", closedOperationId)
                .then()
                .statusCode(400)
                .body("error", containsString("closed or cancelled"));
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
}
