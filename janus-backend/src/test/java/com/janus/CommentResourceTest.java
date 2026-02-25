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
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class CommentResourceTest {

    private static Long operationId;

    @Test
    @Order(1)
    void testSetup() {
        operationId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "MARITIME", "operationCategory": "CATEGORY_1", "containerNumber": "CONT-001", "blNumber": "BL-TEST-001", "blAvailability": "ORIGINAL", "notes": "Comment test op"}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");
    }

    @Test
    @Order(2)
    void testAddComment() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"content": "This is a test comment"}
                        """)
                .when().post("/api/operations/{opId}/comments", operationId)
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("content", is("This is a test comment"))
                .body("authorUsername", is("admin"))
                .body("operationId", is(operationId.intValue()));
    }

    @Test
    @Order(3)
    void testListComments() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{opId}/comments", operationId)
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1));
    }

    @Test
    @Order(4)
    void testClientCanListComments() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/{opId}/comments", operationId)
                .then()
                .statusCode(200);
    }

    @Test
    @Order(5)
    void testClientCannotAddComment() {
        given()
                .auth().basic("client", "client123")
                .contentType(ContentType.JSON)
                .body("""
                        {"content": "Unauthorized comment"}
                        """)
                .when().post("/api/operations/{opId}/comments", operationId)
                .then()
                .statusCode(403);
    }

    @Test
    @Order(6)
    void testCarrierCannotListComments() {
        given()
                .auth().basic("carrier", "carrier123")
                .when().get("/api/operations/{opId}/comments", operationId)
                .then()
                .statusCode(403);
    }
}
