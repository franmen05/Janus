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
class ClientResourceTest {

    private static Long createdClientId;

    // ---- Auth tests ----

    @Test
    @Order(1)
    void testListRequiresAuth() {
        given()
                .when().get("/api/clients")
                .then()
                .statusCode(401);
    }

    @Test
    @Order(2)
    void testClientRoleCannotListClients() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/clients")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(3)
    void testAccountingCannotListClients() {
        given()
                .auth().basic("accounting", "acc123")
                .when().get("/api/clients")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(4)
    void testCarrierCannotListClients() {
        given()
                .auth().basic("carrier", "carrier123")
                .when().get("/api/clients")
                .then()
                .statusCode(403);
    }

    // ---- CRUD tests ----

    @Test
    @Order(10)
    void testAdminCanListClients() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/clients")
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(2));
    }

    @Test
    @Order(11)
    void testAgentCanListClients() {
        given()
                .auth().basic("agent", "agent123")
                .when().get("/api/clients")
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(2));
    }

    @Test
    @Order(12)
    void testGetClientById() {
        var clientId = given()
                .auth().basic("admin", "admin123")
                .when().get("/api/clients")
                .then()
                .statusCode(200)
                .extract().jsonPath().getLong("[0].id");

        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/clients/{id}", clientId)
                .then()
                .statusCode(200)
                .body("id", is((int) clientId))
                .body("name", notNullValue());
    }

    @Test
    @Order(13)
    void testGetNonExistentClient() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/clients/99999")
                .then()
                .statusCode(404)
                .body("error", containsString("not found"));
    }

    @Test
    @Order(20)
    void testCreateClient() {
        createdClientId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "name": "Test Client Corp",
                            "taxId": "RTN-TEST-001",
                            "email": "test@testclient.com",
                            "phone": "+504-9999-0000",
                            "address": "Test City, Honduras"
                        }
                        """)
                .when().post("/api/clients")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("name", is("Test Client Corp"))
                .body("taxId", is("RTN-TEST-001"))
                .body("email", is("test@testclient.com"))
                .body("active", is(true))
                .extract().jsonPath().getLong("id");
    }

    @Test
    @Order(21)
    void testUpdateClient() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "name": "Updated Client Corp",
                            "taxId": "RTN-TEST-001",
                            "email": "updated@testclient.com",
                            "phone": "+504-8888-0000",
                            "address": "Updated City, Honduras"
                        }
                        """)
                .when().put("/api/clients/{id}", createdClientId)
                .then()
                .statusCode(200)
                .body("name", is("Updated Client Corp"))
                .body("email", is("updated@testclient.com"));
    }

    // ---- Role-based create permissions ----

    @Test
    @Order(30)
    void testAgentCanCreateClient() {
        given()
                .auth().basic("agent", "agent123")
                .contentType(ContentType.JSON)
                .body("""
                        {"name": "Agent Created", "taxId": "RTN-AGENT-001", "email": "agentcreated@test.com"}
                        """)
                .when().post("/api/clients")
                .then()
                .statusCode(201);
    }

    @Test
    @Order(31)
    void testClientRoleCannotCreateClient() {
        given()
                .auth().basic("client", "client123")
                .contentType(ContentType.JSON)
                .body("""
                        {"name": "Blocked", "taxId": "RTN-BLOCK-002", "email": "blocked2@test.com"}
                        """)
                .when().post("/api/clients")
                .then()
                .statusCode(403);
    }

    // ---- Validation tests ----

    @Test
    @Order(40)
    void testCreateClientMissingName() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"taxId": "RTN-VAL-001", "email": "val@test.com"}
                        """)
                .when().post("/api/clients")
                .then()
                .statusCode(400);
    }

    @Test
    @Order(41)
    void testCreateClientInvalidEmail() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"name": "Invalid Email Corp", "taxId": "RTN-VAL-002", "email": "not-an-email"}
                        """)
                .when().post("/api/clients")
                .then()
                .statusCode(400);
    }
}
