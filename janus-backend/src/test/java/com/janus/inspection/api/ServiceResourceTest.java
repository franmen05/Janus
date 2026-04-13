package com.janus.inspection.api;

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
class ServiceResourceTest {

    private static Long createdServiceId;
    private static Long createdServiceAllId;

    // ---- Auth / Role tests ----

    @Test
    @Order(1)
    void testListRequiresAuth() {
        given()
                .when().get("/api/services")
                .then()
                .statusCode(401);
    }

    @Test
    @Order(2)
    void testClientCannotAccessAll() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/services/all")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(3)
    void testCarrierCannotAccessServices() {
        given()
                .auth().basic("carrier", "carrier123")
                .when().get("/api/services")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(4)
    void testAgentCanListActive() {
        given()
                .auth().basic("agent", "agent123")
                .when().get("/api/services")
                .then()
                .statusCode(200);
    }

    @Test
    @Order(5)
    void testAccountingCanListActive() {
        given()
                .auth().basic("accounting", "acc123")
                .when().get("/api/services")
                .then()
                .statusCode(200);
    }

    // ---- GET list ----

    @Test
    @Order(10)
    void testListAllServices() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/services/all")
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(10));
    }

    @Test
    @Order(11)
    void testListActiveServices() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/services")
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1));
    }

    // ---- POST create ----

    @Test
    @Order(20)
    void testCreateService() {
        createdServiceId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "name": "TEST_SVC",
                            "labelEs": "Servicio de Prueba",
                            "labelEn": "Test Service",
                            "appliesTo": ["LOGISTICS"]
                        }
                        """)
                .when().post("/api/services")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("name", is("TEST_SVC"))
                .body("labelEs", is("Servicio de Prueba"))
                .body("labelEn", is("Test Service"))
                .body("active", is(true))
                .body("appliesTo.size()", is(1))
                .body("createdAt", notNullValue())
                .extract().jsonPath().getLong("id");
    }

    @Test
    @Order(21)
    void testCreateServiceDefaultAppliesTo() {
        createdServiceAllId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "name": "TEST_SVC_ALL",
                            "labelEs": "Todos los Modulos",
                            "labelEn": "All Modules"
                        }
                        """)
                .when().post("/api/services")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("name", is("TEST_SVC_ALL"))
                .body("appliesTo.size()", is(2))
                .extract().jsonPath().getLong("id");
    }

    @Test
    @Order(22)
    void testCreateDuplicateNameFails() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "name": "TEST_SVC",
                            "labelEs": "Duplicado",
                            "labelEn": "Duplicate"
                        }
                        """)
                .when().post("/api/services")
                .then()
                .statusCode(400)
                .body("error", containsString("already exists"));
    }

    // ---- PUT update ----

    @Test
    @Order(30)
    void testUpdateService() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "labelEs": "Etiqueta Actualizada",
                            "labelEn": "Updated Label",
                            "sortOrder": 99
                        }
                        """)
                .when().put("/api/services/{id}", createdServiceId)
                .then()
                .statusCode(200)
                .body("labelEs", is("Etiqueta Actualizada"))
                .body("labelEn", is("Updated Label"))
                .body("sortOrder", is(99));
    }

    @Test
    @Order(31)
    void testUpdateServiceAppliesTo() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "labelEs": "Etiqueta Actualizada",
                            "labelEn": "Updated Label",
                            "sortOrder": 99,
                            "appliesTo": ["CARGO"]
                        }
                        """)
                .when().put("/api/services/{id}", createdServiceId)
                .then()
                .statusCode(200)
                .body("appliesTo.size()", is(1));
    }

    @Test
    @Order(32)
    void testUpdateNonExistentReturns404() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "labelEs": "No Existe",
                            "labelEn": "Does Not Exist",
                            "sortOrder": 0
                        }
                        """)
                .when().put("/api/services/{id}", 99999)
                .then()
                .statusCode(404);
    }

    // ---- PUT toggle ----

    @Test
    @Order(40)
    void testToggleActive() {
        given()
                .auth().basic("admin", "admin123")
                .when().put("/api/services/{id}/toggle", createdServiceId)
                .then()
                .statusCode(200)
                .body("active", is(false));
    }

    @Test
    @Order(41)
    void testToggleBackActive() {
        given()
                .auth().basic("admin", "admin123")
                .when().put("/api/services/{id}/toggle", createdServiceId)
                .then()
                .statusCode(200)
                .body("active", is(true));
    }

    // ---- DELETE ----

    @Test
    @Order(50)
    void testDeleteNonExistentReturns404() {
        given()
                .auth().basic("admin", "admin123")
                .when().delete("/api/services/{id}", 99999)
                .then()
                .statusCode(404);
    }

    @Test
    @Order(51)
    void testDeleteService() {
        given()
                .auth().basic("admin", "admin123")
                .when().delete("/api/services/{id}", createdServiceId)
                .then()
                .statusCode(204);
    }

    @Test
    @Order(52)
    void testDeleteSecondService() {
        given()
                .auth().basic("admin", "admin123")
                .when().delete("/api/services/{id}", createdServiceAllId)
                .then()
                .statusCode(204);
    }

    @Test
    @Order(53)
    void testDeletedServiceNoLongerInList() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/services/all")
                .then()
                .statusCode(200)
                .body("size()", is(10));
    }

    // ---- Non-ADMIN write restrictions ----

    @Test
    @Order(60)
    void testAgentCannotCreate() {
        given()
                .auth().basic("agent", "agent123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "name": "HACK_SVC",
                            "labelEs": "Hack",
                            "labelEn": "Hack"
                        }
                        """)
                .when().post("/api/services")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(61)
    void testAgentCannotDelete() {
        given()
                .auth().basic("agent", "agent123")
                .when().delete("/api/services/1")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(62)
    void testClientCannotToggle() {
        given()
                .auth().basic("client", "client123")
                .when().put("/api/services/1/toggle")
                .then()
                .statusCode(403);
    }
}
