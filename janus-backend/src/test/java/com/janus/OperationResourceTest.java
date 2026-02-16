package com.janus;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

@QuarkusTest
class OperationResourceTest {

    @Test
    void testListOperationsRequiresAuth() {
        given()
                .when().get("/api/operations")
                .then()
                .statusCode(401);
    }

    @Test
    void testListOperationsWithAuth() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations")
                .then()
                .statusCode(200);
    }

    @Test
    void testGetCurrentUser() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/users/me")
                .then()
                .statusCode(200)
                .body("username", is("admin"))
                .body("role", is("ADMIN"));
    }

    @Test
    void testListClients() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/clients")
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(2));
    }

    @Test
    void testClientAccessDeniedForClientRole() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/clients")
                .then()
                .statusCode(403);
    }
}
