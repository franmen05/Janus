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
class AccountResourceTest {

    private static Long createdAccountId;

    // ---- Auth tests ----

    @Test
    @Order(1)
    void testListRequiresAuth() {
        given()
                .when().get("/api/accounts")
                .then()
                .statusCode(401);
    }

    @Test
    @Order(2)
    void testCustomerRoleCannotListAccounts() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/accounts")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(3)
    void testAccountingCannotListAccounts() {
        given()
                .auth().basic("accounting", "acc123")
                .when().get("/api/accounts")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(4)
    void testCarrierCannotListAccounts() {
        given()
                .auth().basic("carrier", "carrier123")
                .when().get("/api/accounts")
                .then()
                .statusCode(403);
    }

    // ---- CRUD tests ----

    @Test
    @Order(10)
    void testAdminCanListAccounts() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/accounts")
                .then()
                .statusCode(200)
                .body("content.size()", greaterThanOrEqualTo(2));
    }

    @Test
    @Order(11)
    void testAgentCanListAccounts() {
        given()
                .auth().basic("agent", "agent123")
                .when().get("/api/accounts")
                .then()
                .statusCode(200)
                .body("content.size()", greaterThanOrEqualTo(2));
    }

    @Test
    @Order(12)
    void testGetAccountById() {
        var accountId = given()
                .auth().basic("admin", "admin123")
                .when().get("/api/accounts")
                .then()
                .statusCode(200)
                .extract().jsonPath().getLong("content[0].id");

        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/accounts/{id}", accountId)
                .then()
                .statusCode(200)
                .body("id", is((int) accountId))
                .body("name", notNullValue());
    }

    @Test
    @Order(13)
    void testGetNonExistentAccount() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/accounts/99999")
                .then()
                .statusCode(404)
                .body("error", containsString("not found"));
    }

    @Test
    @Order(20)
    void testCreateAccount() {
        createdAccountId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "name": "Test Account Corp",
                            "taxId": "RTN-TEST-001",
                            "email": "test@testaccount.com",
                            "phone": "+504-9999-0000",
                            "address": "Test City, Honduras",
                            "accountTypes": ["COMPANY"]
                        }
                        """)
                .when().post("/api/accounts")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("name", is("Test Account Corp"))
                .body("taxId", is("RTN-TEST-001"))
                .body("email", is("test@testaccount.com"))
                .body("active", is(true))
                .extract().jsonPath().getLong("id");
    }

    @Test
    @Order(21)
    void testUpdateAccount() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "name": "Updated Account Corp",
                            "taxId": "RTN-TEST-001",
                            "email": "updated@testaccount.com",
                            "phone": "+504-8888-0000",
                            "address": "Updated City, Honduras",
                            "accountTypes": ["COMPANY"]
                        }
                        """)
                .when().put("/api/accounts/{id}", createdAccountId)
                .then()
                .statusCode(200)
                .body("name", is("Updated Account Corp"))
                .body("email", is("updated@testaccount.com"));
    }

    // ---- Role-based create permissions ----

    @Test
    @Order(30)
    void testAgentCanCreateAccount() {
        given()
                .auth().basic("agent", "agent123")
                .contentType(ContentType.JSON)
                .body("""
                        {"name": "Agent Created", "taxId": "RTN-AGENT-001", "email": "agentcreated@test.com", "accountTypes": ["COMPANY"]}
                        """)
                .when().post("/api/accounts")
                .then()
                .statusCode(201);
    }

    @Test
    @Order(31)
    void testCustomerRoleCannotCreateAccount() {
        given()
                .auth().basic("client", "client123")
                .contentType(ContentType.JSON)
                .body("""
                        {"name": "Blocked", "taxId": "RTN-BLOCK-002", "email": "blocked2@test.com", "accountTypes": ["COMPANY"]}
                        """)
                .when().post("/api/accounts")
                .then()
                .statusCode(403);
    }

    // ---- Validation tests ----

    @Test
    @Order(40)
    void testCreateAccountMissingName() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"taxId": "RTN-VAL-001", "email": "val@test.com"}
                        """)
                .when().post("/api/accounts")
                .then()
                .statusCode(400);
    }

    @Test
    @Order(41)
    void testCreateAccountInvalidEmail() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"name": "Invalid Email Corp", "taxId": "RTN-VAL-002", "email": "not-an-email"}
                        """)
                .when().post("/api/accounts")
                .then()
                .statusCode(400);
    }

    @Test
    @Order(42)
    void testCreateDuplicateNameCaseInsensitive() {
        // "Updated Account Corp" was set in Order(21) — try different case
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "name": "updated account corp",
                            "taxId": "RTN-DUP-NAME-001",
                            "email": "dup@test.com",
                            "accountTypes": ["COMPANY"]
                        }
                        """)
                .when().post("/api/accounts")
                .then()
                .statusCode(400)
                .body("errorCode", is("ACCOUNT_NAME_ALREADY_EXISTS"));
    }

    @Test
    @Order(43)
    void testCreateDuplicateTaxIdCaseInsensitive() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "name": "Unique Name Corp",
                            "taxId": "rtn-test-001",
                            "email": "taxdup@test.com",
                            "accountTypes": ["COMPANY"]
                        }
                        """)
                .when().post("/api/accounts")
                .then()
                .statusCode(400)
                .body("errorCode", is("ACCOUNT_TAX_ID_ALREADY_EXISTS"));
    }
}
