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
class UserResourceTest {

    // ---- Auth tests ----

    @Test
    @Order(1)
    void testListRequiresAuth() {
        given()
                .when().get("/api/users")
                .then()
                .statusCode(401);
    }

    @Test
    @Order(2)
    void testAgentCannotListUsers() {
        given()
                .auth().basic("agent", "agent123")
                .when().get("/api/users")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(3)
    void testClientCannotListUsers() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/users")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(4)
    void testMeRequiresAuth() {
        given()
                .when().get("/api/users/me")
                .then()
                .statusCode(401);
    }

    // ---- /me endpoint for all roles ----

    @Test
    @Order(10)
    void testMeAsAdmin() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/users/me")
                .then()
                .statusCode(200)
                .body("username", is("admin"))
                .body("role", is("ADMIN"))
                .body("fullName", is("System Administrator"));
    }

    @Test
    @Order(11)
    void testMeAsAgent() {
        given()
                .auth().basic("agent", "agent123")
                .when().get("/api/users/me")
                .then()
                .statusCode(200)
                .body("username", is("agent"))
                .body("role", is("AGENT"));
    }

    @Test
    @Order(12)
    void testMeAsAccounting() {
        given()
                .auth().basic("accounting", "acc123")
                .when().get("/api/users/me")
                .then()
                .statusCode(200)
                .body("username", is("accounting"))
                .body("role", is("ACCOUNTING"));
    }

    @Test
    @Order(13)
    void testMeAsClient() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/users/me")
                .then()
                .statusCode(200)
                .body("username", is("client"))
                .body("role", is("CLIENT"))
                .body("clientId", notNullValue());
    }

    @Test
    @Order(14)
    void testMeAsCarrier() {
        given()
                .auth().basic("carrier", "carrier123")
                .when().get("/api/users/me")
                .then()
                .statusCode(200)
                .body("username", is("carrier"))
                .body("role", is("CARRIER"));
    }

    // ---- CRUD tests ----

    @Test
    @Order(20)
    void testAdminCanListUsers() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/users")
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(5));
    }

    @Test
    @Order(21)
    void testAdminCanCreateUser() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "username": "newuser",
                            "password": "newpass123",
                            "fullName": "New Test User",
                            "email": "newuser@janus.com",
                            "role": "AGENT"
                        }
                        """)
                .when().post("/api/users")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("username", is("newuser"))
                .body("role", is("AGENT"));
    }

    @Test
    @Order(22)
    void testAgentCannotCreateUser() {
        given()
                .auth().basic("agent", "agent123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "username": "blocked",
                            "password": "pass123",
                            "fullName": "Blocked User",
                            "email": "blocked@janus.com",
                            "role": "AGENT"
                        }
                        """)
                .when().post("/api/users")
                .then()
                .statusCode(403);
    }

    // ---- Validation tests ----

    @Test
    @Order(30)
    void testCreateUserMissingFields() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"username": "incomplete"}
                        """)
                .when().post("/api/users")
                .then()
                .statusCode(400);
    }
}
