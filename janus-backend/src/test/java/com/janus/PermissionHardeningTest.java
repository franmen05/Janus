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
    private static Long otherCustomerOperationId;

    @Test
    @Order(1)
    void testSetupOperations() {
        // Create an operation with customer 1 (the "client" user's customer)
        operationId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"customerId": 1, "operationType": "IMPORT", "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-TEST-001", "estimatedArrival": "2025-12-01T10:00:00", "blAvailability": "ORIGINAL", "arrivalPortId": 1}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // Create an operation with customer 2 (NOT the "client" user's customer)
        otherCustomerOperationId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"customerId": 2, "operationType": "IMPORT", "transportMode": "MARITIME", "operationCategory": "CATEGORY_3", "containerNumber": "CONT-002", "blNumber": "BL-TEST-002", "estimatedArrival": "2025-12-01T10:00:00", "blAvailability": "ORIGINAL", "arrivalPortId": 1}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");
    }

    // --- CUSTOMER DATA ISOLATION ---

    @Test
    @Order(2)
    void testCustomerSeesOnlyOwnOperations() {
        var ops = given()
                .auth().basic("client", "client123")
                .when().get("/api/operations")
                .then().statusCode(200)
                .body("content.size()", greaterThanOrEqualTo(1))
                .extract().jsonPath().getList("content.customerId", Long.class);

        // All returned operations should belong to customer 1
        for (Long cid : ops) {
            assert cid == 1L : "CUSTOMER sees operations from another customer: " + cid;
        }
    }

    @Test
    @Order(3)
    void testCustomerCanAccessOwnOperation() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{id}", operationId)
                .then().statusCode(200)
                .body("id", is(operationId.intValue()));
    }

    @Test
    @Order(4)
    void testCustomerCannotAccessOtherCustomerOperation() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{id}", otherCustomerOperationId)
                .then().statusCode(403)
                .body("error", is("Access denied: operation does not belong to your customer"));
    }

    @Test
    @Order(5)
    void testCustomerCannotAccessOtherCustomerHistory() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{id}/history", otherCustomerOperationId)
                .then().statusCode(403);
    }

    @Test
    @Order(6)
    void testCustomerCannotAccessOtherCustomerDocuments() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{id}/documents", otherCustomerOperationId)
                .then().statusCode(403);
    }

    @Test
    @Order(7)
    void testCustomerCannotAccessOtherCustomerComments() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{id}/comments", otherCustomerOperationId)
                .then().statusCode(403);
    }

    @Test
    @Order(8)
    void testCustomerCannotAccessOtherCustomerTimeline() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{id}/timeline", otherCustomerOperationId)
                .then().statusCode(403);
    }

    @Test
    @Order(9)
    void testCustomerCannotAccessOtherCustomerCompleteness() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{id}/documents/completeness", otherCustomerOperationId)
                .then().statusCode(403);
    }

    @Test
    @Order(10)
    void testCustomerCannotAccessOtherCustomerCrossing() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{id}/declarations/crossing", otherCustomerOperationId)
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
                        {"customerId": 1, "operationType": "IMPORT", "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-TEST-001", "estimatedArrival": "2025-12-01T10:00:00", "blAvailability": "ORIGINAL", "arrivalPortId": 1}
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

    // --- CUSTOMER CANNOT MODIFY ---

    @Test
    @Order(21)
    void testCustomerCannotCreateOperations() {
        given()
                .auth().basic("client", "client123")
                .contentType(ContentType.JSON)
                .body("""
                        {"customerId": 1, "operationType": "IMPORT", "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-TEST-001", "estimatedArrival": "2025-12-01T10:00:00", "blAvailability": "ORIGINAL", "arrivalPortId": 1}
                        """)
                .when().post("/api/operations")
                .then().statusCode(403);
    }

    @Test
    @Order(22)
    void testCustomerCannotUploadDocuments() {
        given()
                .auth().preemptive().basic("client", "client123")
                .multiPart("file", "test.pdf", new byte[]{1, 2, 3}, "application/pdf")
                .multiPart("documentType", "BILL_OF_LADING")
                .when().post("/api/operations/{id}/documents", operationId)
                .then().statusCode(403);
    }

    @Test
    @Order(23)
    void testCustomerCannotAddComments() {
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
    void testCustomerCannotAccessAlerts() {
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
                .when().get("/api/operations/{id}", otherCustomerOperationId)
                .then()
                .statusCode(403)
                .contentType(ContentType.JSON)
                .body("$", hasKey("error"));
    }
}
