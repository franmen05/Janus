package com.janus;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.notNullValue;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuditResourceTest {

    // ---- Auth tests ----

    @Test
    @Order(1)
    void testListRequiresAuth() {
        given()
                .when().get("/api/audit")
                .then()
                .statusCode(401);
    }

    @Test
    @Order(2)
    void testAgentCannotListAll() {
        given()
                .auth().basic("agent", "agent123")
                .when().get("/api/audit")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(3)
    void testClientCannotListAll() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/audit")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(4)
    void testAccountingCannotListAll() {
        given()
                .auth().basic("accounting", "acc123")
                .when().get("/api/audit")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(5)
    void testCarrierCannotListAll() {
        given()
                .auth().basic("carrier", "carrier123")
                .when().get("/api/audit")
                .then()
                .statusCode(403);
    }

    // ---- Read tests ----

    @Test
    @Order(10)
    void testAdminCanListAll() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/audit")
                .then()
                .statusCode(200)
                .body(notNullValue());
    }

    @Test
    @Order(11)
    void testAdminCanFilterByUsername() {
        given()
                .auth().basic("admin", "admin123")
                .queryParam("username", "admin")
                .when().get("/api/audit")
                .then()
                .statusCode(200)
                .body(notNullValue());
    }

    // ---- By operation tests ----

    @Test
    @Order(20)
    void testAdminCanGetByOperation() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/audit/operations/1")
                .then()
                .statusCode(200)
                .body(notNullValue());
    }

    @Test
    @Order(21)
    void testAgentCanGetByOperation() {
        given()
                .auth().basic("agent", "agent123")
                .when().get("/api/audit/operations/1")
                .then()
                .statusCode(200)
                .body(notNullValue());
    }

    @Test
    @Order(22)
    void testAccountingCannotGetByOperation() {
        given()
                .auth().basic("accounting", "acc123")
                .when().get("/api/audit/operations/1")
                .then()
                .statusCode(403);
    }
}
