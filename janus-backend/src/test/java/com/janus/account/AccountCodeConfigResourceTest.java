package com.janus.account;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.startsWith;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AccountCodeConfigResourceTest {

    @Test
    @Order(1)
    void getConfigRequiresAuth() {
        given()
                .when().get("/api/accounts/code-config")
                .then().statusCode(401);
    }

    @Test
    @Order(2)
    void clientCannotReadConfig() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/accounts/code-config")
                .then().statusCode(403);
    }

    @Test
    @Order(3)
    void agentCanReadConfig() {
        given()
                .auth().basic("agent", "agent123")
                .when().get("/api/accounts/code-config")
                .then()
                .statusCode(200)
                .body("prefix", is("ACC"))
                .body("separator", is("-"))
                .body("paddingLength", is(5))
                .body("enabled", is(true));
    }

    @Test
    @Order(4)
    void agentCannotUpdateConfig() {
        given()
                .auth().basic("agent", "agent123")
                .contentType(ContentType.JSON)
                .body("""
                        {"prefix":"ACC","separator":"-","paddingLength":5,"enabled":true}
                        """)
                .when().put("/api/accounts/code-config")
                .then().statusCode(403);
    }

    @Test
    @Order(5)
    void adminCanUpdateConfig() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"prefix":"ACC","separator":"-","paddingLength":6,"enabled":true}
                        """)
                .when().put("/api/accounts/code-config")
                .then()
                .statusCode(200)
                .body("paddingLength", is(6));
    }

    @Test
    @Order(6)
    void invalidPrefixIsRejected() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"prefix":"","separator":"-","paddingLength":5,"enabled":true}
                        """)
                .when().put("/api/accounts/code-config")
                .then()
                .statusCode(400)
                .body("errorCode", is("ACCOUNT_CODE_CONFIG_INVALID_PREFIX"));
    }

    @Test
    @Order(7)
    void invalidPaddingIsRejected() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"prefix":"ACC","separator":"-","paddingLength":99,"enabled":true}
                        """)
                .when().put("/api/accounts/code-config")
                .then()
                .statusCode(400)
                .body("errorCode", is("ACCOUNT_CODE_CONFIG_INVALID_PADDING"));
    }

    @Test
    @Order(10)
    void resetConfigToDefaults() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"prefix":"ACC","separator":"-","paddingLength":5,"enabled":true}
                        """)
                .when().put("/api/accounts/code-config")
                .then().statusCode(200);
    }

    @Test
    @Order(11)
    void createAccountWithoutCodeAutoGenerates() {
        String generated = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "name": "AutoGen Test Corp",
                            "taxId": "RTN-AUTOGEN-001",
                            "email": "autogen@test.com",
                            "accountTypes": ["COMPANY"]
                        }
                        """)
                .when().post("/api/accounts")
                .then()
                .statusCode(201)
                .body("accountCode", startsWith("ACC-"))
                .body("accountCode", matchesPattern("ACC-\\d{5}"))
                .extract().jsonPath().getString("accountCode");

        // Confirm not null
        assert generated != null;
    }

    @Test
    @Order(12)
    void createAccountWithProvidedCodeKeepsIt() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "name": "Provided Code Corp",
                            "taxId": "RTN-PROV-001",
                            "email": "provided@test.com",
                            "accountTypes": ["COMPANY"],
                            "accountCode": "CUSTOM-001"
                        }
                        """)
                .when().post("/api/accounts")
                .then()
                .statusCode(201)
                .body("accountCode", is("CUSTOM-001"));
    }

    @Test
    @Order(13)
    void autoGenSkipsNonMatchingPrefixes() {
        // Create with custom prefix code that does NOT match ACC-
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "name": "Other Prefix Corp",
                            "taxId": "RTN-OTHER-001",
                            "email": "other@test.com",
                            "accountTypes": ["COMPANY"],
                            "accountCode": "JMC-99999"
                        }
                        """)
                .when().post("/api/accounts")
                .then().statusCode(201);

        // Now auto-generate; the JMC code must be ignored — sequence stays in ACC space
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "name": "After Other Corp",
                            "taxId": "RTN-AFTER-001",
                            "email": "after@test.com",
                            "accountTypes": ["COMPANY"]
                        }
                        """)
                .when().post("/api/accounts")
                .then()
                .statusCode(201)
                .body("accountCode", matchesPattern("ACC-\\d{5}"));
    }
}
