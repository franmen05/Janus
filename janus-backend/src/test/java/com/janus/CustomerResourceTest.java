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
class CustomerResourceTest {

    private static Long createdCustomerId;

    // ---- Auth tests ----

    @Test
    @Order(1)
    void testListRequiresAuth() {
        given()
                .when().get("/api/customers")
                .then()
                .statusCode(401);
    }

    @Test
    @Order(2)
    void testCustomerRoleCannotListCustomers() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/customers")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(3)
    void testAccountingCannotListCustomers() {
        given()
                .auth().basic("accounting", "acc123")
                .when().get("/api/customers")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(4)
    void testCarrierCannotListCustomers() {
        given()
                .auth().basic("carrier", "carrier123")
                .when().get("/api/customers")
                .then()
                .statusCode(403);
    }

    // ---- CRUD tests ----

    @Test
    @Order(10)
    void testAdminCanListCustomers() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/customers")
                .then()
                .statusCode(200)
                .body("content.size()", greaterThanOrEqualTo(2));
    }

    @Test
    @Order(11)
    void testAgentCanListCustomers() {
        given()
                .auth().basic("agent", "agent123")
                .when().get("/api/customers")
                .then()
                .statusCode(200)
                .body("content.size()", greaterThanOrEqualTo(2));
    }

    @Test
    @Order(12)
    void testGetCustomerById() {
        var customerId = given()
                .auth().basic("admin", "admin123")
                .when().get("/api/customers")
                .then()
                .statusCode(200)
                .extract().jsonPath().getLong("content[0].id");

        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/customers/{id}", customerId)
                .then()
                .statusCode(200)
                .body("id", is((int) customerId))
                .body("name", notNullValue());
    }

    @Test
    @Order(13)
    void testGetNonExistentCustomer() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/customers/99999")
                .then()
                .statusCode(404)
                .body("error", containsString("not found"));
    }

    @Test
    @Order(20)
    void testCreateCustomer() {
        createdCustomerId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "name": "Test Customer Corp",
                            "taxId": "RTN-TEST-001",
                            "email": "test@testcustomer.com",
                            "phone": "+504-9999-0000",
                            "address": "Test City, Honduras",
                            "customerTypes": ["COMPANY"]
                        }
                        """)
                .when().post("/api/customers")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("name", is("Test Customer Corp"))
                .body("taxId", is("RTN-TEST-001"))
                .body("email", is("test@testcustomer.com"))
                .body("active", is(true))
                .extract().jsonPath().getLong("id");
    }

    @Test
    @Order(21)
    void testUpdateCustomer() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "name": "Updated Customer Corp",
                            "taxId": "RTN-TEST-001",
                            "email": "updated@testcustomer.com",
                            "phone": "+504-8888-0000",
                            "address": "Updated City, Honduras",
                            "customerTypes": ["COMPANY"]
                        }
                        """)
                .when().put("/api/customers/{id}", createdCustomerId)
                .then()
                .statusCode(200)
                .body("name", is("Updated Customer Corp"))
                .body("email", is("updated@testcustomer.com"));
    }

    // ---- Role-based create permissions ----

    @Test
    @Order(30)
    void testAgentCanCreateCustomer() {
        given()
                .auth().basic("agent", "agent123")
                .contentType(ContentType.JSON)
                .body("""
                        {"name": "Agent Created", "taxId": "RTN-AGENT-001", "email": "agentcreated@test.com", "customerTypes": ["COMPANY"]}
                        """)
                .when().post("/api/customers")
                .then()
                .statusCode(201);
    }

    @Test
    @Order(31)
    void testCustomerRoleCannotCreateCustomer() {
        given()
                .auth().basic("client", "client123")
                .contentType(ContentType.JSON)
                .body("""
                        {"name": "Blocked", "taxId": "RTN-BLOCK-002", "email": "blocked2@test.com", "customerTypes": ["COMPANY"]}
                        """)
                .when().post("/api/customers")
                .then()
                .statusCode(403);
    }

    // ---- Validation tests ----

    @Test
    @Order(40)
    void testCreateCustomerMissingName() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"taxId": "RTN-VAL-001", "email": "val@test.com"}
                        """)
                .when().post("/api/customers")
                .then()
                .statusCode(400);
    }

    @Test
    @Order(41)
    void testCreateCustomerInvalidEmail() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"name": "Invalid Email Corp", "taxId": "RTN-VAL-002", "email": "not-an-email"}
                        """)
                .when().post("/api/customers")
                .then()
                .statusCode(400);
    }
}
