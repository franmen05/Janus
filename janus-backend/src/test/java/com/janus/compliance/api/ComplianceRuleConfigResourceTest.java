package com.janus.compliance.api;

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
class ComplianceRuleConfigResourceTest {

    private static Long createdConfigId;

    // ---- Auth / Role tests ----

    @Test
    @Order(1)
    void testListRequiresAuth() {
        given()
                .when().get("/api/compliance/config")
                .then()
                .statusCode(401);
    }

    @Test
    @Order(2)
    void testAgentCannotAccessConfig() {
        given()
                .auth().basic("agent", "agent123")
                .when().get("/api/compliance/config")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(3)
    void testClientCannotAccessConfig() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/compliance/config")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(4)
    void testAccountingCannotAccessConfig() {
        given()
                .auth().basic("accounting", "acc123")
                .when().get("/api/compliance/config")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(5)
    void testCarrierCannotAccessConfig() {
        given()
                .auth().basic("carrier", "carrier123")
                .when().get("/api/compliance/config")
                .then()
                .statusCode(403);
    }

    // ---- GET list ----

    @Test
    @Order(10)
    void testListAllConfigs() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/compliance/config")
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1));
    }

    // ---- GET by ruleCode ----

    @Test
    @Order(11)
    void testGetByRuleCode() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/compliance/config/{ruleCode}", "COMPLETENESS_REQUIRED")
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1))
                .body("[0].ruleCode", is("COMPLETENESS_REQUIRED"));
    }

    @Test
    @Order(12)
    void testGetByNonExistentRuleCodeReturnsEmptyList() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/compliance/config/{ruleCode}", "NON_EXISTENT_RULE")
                .then()
                .statusCode(200)
                .body("size()", is(0));
    }

    // ---- POST create ----

    @Test
    @Order(20)
    void testCreateConfig() {
        createdConfigId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "ruleCode": "TEST_RULE",
                            "paramKey": "test_param",
                            "paramValue": "test_value",
                            "enabled": true,
                            "description": "Test config for unit test"
                        }
                        """)
                .when().post("/api/compliance/config")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("ruleCode", is("TEST_RULE"))
                .body("paramKey", is("test_param"))
                .body("paramValue", is("test_value"))
                .body("enabled", is(true))
                .body("description", is("Test config for unit test"))
                .extract().jsonPath().getLong("id");
    }

    @Test
    @Order(21)
    void testCreatedConfigAppearsInList() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/compliance/config/{ruleCode}", "TEST_RULE")
                .then()
                .statusCode(200)
                .body("size()", is(1))
                .body("[0].paramKey", is("test_param"));
    }

    // ---- PUT update ----

    @Test
    @Order(30)
    void testUpdateConfig() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "paramValue": "updated_value",
                            "enabled": false,
                            "description": "Updated description"
                        }
                        """)
                .when().put("/api/compliance/config/{id}", createdConfigId)
                .then()
                .statusCode(200)
                .body("paramValue", is("updated_value"))
                .body("enabled", is(false))
                .body("description", is("Updated description"));
    }

    @Test
    @Order(31)
    void testUpdateConfigNullDescriptionKeepsOriginal() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "paramValue": "another_value",
                            "enabled": true
                        }
                        """)
                .when().put("/api/compliance/config/{id}", createdConfigId)
                .then()
                .statusCode(200)
                .body("paramValue", is("another_value"))
                .body("enabled", is(true))
                .body("description", is("Updated description"));
    }

    @Test
    @Order(32)
    void testUpdateNonExistentConfigReturns404() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "paramValue": "value",
                            "enabled": true
                        }
                        """)
                .when().put("/api/compliance/config/{id}", 99999)
                .then()
                .statusCode(404)
                .body("error", containsString("not found"));
    }

    // ---- DELETE ----

    @Test
    @Order(40)
    void testDeleteNonExistentConfigReturns404() {
        given()
                .auth().basic("admin", "admin123")
                .when().delete("/api/compliance/config/{id}", 99999)
                .then()
                .statusCode(404)
                .body("error", containsString("not found"));
    }

    @Test
    @Order(41)
    void testDeleteConfig() {
        given()
                .auth().basic("admin", "admin123")
                .when().delete("/api/compliance/config/{id}", createdConfigId)
                .then()
                .statusCode(204);
    }

    @Test
    @Order(42)
    void testDeletedConfigNoLongerExists() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/compliance/config/{ruleCode}", "TEST_RULE")
                .then()
                .statusCode(200)
                .body("size()", is(0));
    }

    // ---- Non-ADMIN write operations ----

    @Test
    @Order(50)
    void testAgentCannotCreateConfig() {
        given()
                .auth().basic("agent", "agent123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "ruleCode": "HACK",
                            "paramKey": "enabled",
                            "paramValue": "false",
                            "enabled": true
                        }
                        """)
                .when().post("/api/compliance/config")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(51)
    void testClientCannotDeleteConfig() {
        given()
                .auth().basic("client", "client123")
                .when().delete("/api/compliance/config/1")
                .then()
                .statusCode(403);
    }
}
