package com.janus;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasKey;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class PermissionHardeningTest {

    private static Long operationId;
    private static Long otherClientOperationId;

    @Test
    @Order(1)
    void testSetupOperations() {
        // Create an operation with client 1 (the "client" user's client)
        operationId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "cargoType": "LCL", "inspectionType": "EXPRESS"}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // Create an operation with client 2 (NOT the "client" user's client)
        otherClientOperationId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 2, "cargoType": "FCL", "inspectionType": "PHYSICAL"}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");
    }

    // --- CLIENT DATA ISOLATION ---

    @Test
    @Order(2)
    void testClientSeesOnlyOwnOperations() {
        var ops = given()
                .auth().basic("client", "client123")
                .when().get("/api/operations")
                .then().statusCode(200)
                .body("size()", greaterThanOrEqualTo(1))
                .extract().jsonPath().getList("clientId", Long.class);

        // All returned operations should belong to client 1
        for (Long cid : ops) {
            assert cid == 1L : "CLIENT sees operations from another client: " + cid;
        }
    }

    @Test
    @Order(3)
    void testClientCanAccessOwnOperation() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{id}", operationId)
                .then().statusCode(200)
                .body("id", is(operationId.intValue()));
    }

    @Test
    @Order(4)
    void testClientCannotAccessOtherClientOperation() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{id}", otherClientOperationId)
                .then().statusCode(403)
                .body("error", is("Access denied: operation does not belong to your client"));
    }

    @Test
    @Order(5)
    void testClientCannotAccessOtherClientHistory() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{id}/history", otherClientOperationId)
                .then().statusCode(403);
    }

    @Test
    @Order(6)
    void testClientCannotAccessOtherClientDocuments() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{id}/documents", otherClientOperationId)
                .then().statusCode(403);
    }

    @Test
    @Order(7)
    void testClientCannotAccessOtherClientComments() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{id}/comments", otherClientOperationId)
                .then().statusCode(403);
    }

    @Test
    @Order(8)
    void testClientCannotAccessOtherClientTimeline() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{id}/timeline", otherClientOperationId)
                .then().statusCode(403);
    }

    @Test
    @Order(9)
    void testClientCannotAccessOtherClientCompleteness() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{id}/documents/completeness", otherClientOperationId)
                .then().statusCode(403);
    }

    @Test
    @Order(10)
    void testClientCannotAccessOtherClientCrossing() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{id}/declarations/crossing", otherClientOperationId)
                .then().statusCode(403);
    }

    // --- CARRIER BLOCKED EVERYWHERE ---

    @Test
    @Order(11)
    void testCarrierCannotListOperations() {
        given()
                .auth().basic("carrier", "carrier123")
                .when().get("/api/operations")
                .then().statusCode(403);
    }

    @Test
    @Order(12)
    void testCarrierCannotAccessAlerts() {
        given()
                .auth().basic("carrier", "carrier123")
                .when().get("/api/alerts")
                .then().statusCode(403);
    }

    @Test
    @Order(13)
    void testCarrierCannotAccessDashboard() {
        given()
                .auth().basic("carrier", "carrier123")
                .when().get("/api/dashboard/metrics")
                .then().statusCode(403);
    }

    @Test
    @Order(14)
    void testCarrierCannotAccessDeclarations() {
        given()
                .auth().basic("carrier", "carrier123")
                .when().get("/api/operations/" + operationId + "/declarations")
                .then().statusCode(403);
    }

    @Test
    @Order(15)
    void testCarrierCannotAccessComments() {
        given()
                .auth().basic("carrier", "carrier123")
                .when().get("/api/operations/" + operationId + "/comments")
                .then().statusCode(403);
    }

    // --- ACCOUNTING READ-ONLY ---

    @Test
    @Order(16)
    void testAccountingCanListOperations() {
        given()
                .auth().basic("accounting", "acc123")
                .when().get("/api/operations")
                .then().statusCode(200);
    }

    @Test
    @Order(17)
    void testAccountingCannotCreateOperations() {
        given()
                .auth().basic("accounting", "acc123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "cargoType": "LCL", "inspectionType": "EXPRESS"}
                        """)
                .when().post("/api/operations")
                .then().statusCode(403);
    }

    @Test
    @Order(18)
    void testAccountingCannotChangeStatus() {
        given()
                .auth().basic("accounting", "acc123")
                .contentType(ContentType.JSON)
                .body("""
                        {"newStatus": "DOCUMENT_COLLECTION"}
                        """)
                .when().post("/api/operations/{id}/change-status", operationId)
                .then().statusCode(403);
    }

    @Test
    @Order(19)
    void testAccountingCannotDeleteOperations() {
        given()
                .auth().basic("accounting", "acc123")
                .when().delete("/api/operations/{id}", operationId)
                .then().statusCode(403);
    }

    @Test
    @Order(20)
    void testAccountingCannotUploadDocuments() {
        given()
                .auth().preemptive().basic("accounting", "acc123")
                .multiPart("file", "test.pdf", new byte[]{1, 2, 3}, "application/pdf")
                .multiPart("documentType", "BILL_OF_LADING")
                .when().post("/api/operations/{id}/documents", operationId)
                .then().statusCode(403);
    }

    // --- CLIENT CANNOT MODIFY ---

    @Test
    @Order(21)
    void testClientCannotCreateOperations() {
        given()
                .auth().basic("client", "client123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "cargoType": "LCL", "inspectionType": "EXPRESS"}
                        """)
                .when().post("/api/operations")
                .then().statusCode(403);
    }

    @Test
    @Order(22)
    void testClientCannotUploadDocuments() {
        given()
                .auth().preemptive().basic("client", "client123")
                .multiPart("file", "test.pdf", new byte[]{1, 2, 3}, "application/pdf")
                .multiPart("documentType", "BILL_OF_LADING")
                .when().post("/api/operations/{id}/documents", operationId)
                .then().statusCode(403);
    }

    @Test
    @Order(23)
    void testClientCannotAddComments() {
        given()
                .auth().basic("client", "client123")
                .contentType(ContentType.JSON)
                .body("""
                        {"content": "Test comment from client"}
                        """)
                .when().post("/api/operations/{id}/comments", operationId)
                .then().statusCode(403);
    }

    @Test
    @Order(24)
    void testClientCannotAccessAlerts() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/alerts")
                .then().statusCode(403);
    }

    // --- FORBIDDEN RETURNS JSON ---

    @Test
    @Order(25)
    void testForbiddenResponseIsJson() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{id}", otherClientOperationId)
                .then()
                .statusCode(403)
                .contentType(ContentType.JSON)
                .body("$", hasKey("error"));
    }
}
