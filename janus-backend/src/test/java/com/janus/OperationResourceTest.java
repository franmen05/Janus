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
class OperationResourceTest {

    private static Long createdOperationId;

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
                        {"clientId": 1, "cargoType": "FCL", "inspectionType": "EXPRESS"}
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
                        {"clientId": 1, "cargoType": "FCL", "inspectionType": "EXPRESS"}
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
                        {"clientId": 1, "cargoType": "FCL", "inspectionType": "EXPRESS", "notes": "Test operation"}
                        """)
                .when().post("/api/operations")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("referenceNumber", notNullValue())
                .body("status", is("DRAFT"))
                .body("cargoType", is("FCL"))
                .body("inspectionType", is("EXPRESS"))
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
                        {"clientId": 1, "cargoType": "LCL", "inspectionType": "PHYSICAL", "notes": "Updated notes"}
                        """)
                .when().put("/api/operations/{id}", createdOperationId)
                .then()
                .statusCode(200)
                .body("cargoType", is("LCL"))
                .body("inspectionType", is("PHYSICAL"))
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
                        {"clientId": 2, "cargoType": "LCL", "inspectionType": "VISUAL"}
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
        var opId = given()
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

    // ---- Delete tests ----

    @Test
    @Order(30)
    void testDeleteDraftOperation() {
        var draftId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "cargoType": "FCL", "inspectionType": "EXPRESS"}
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
