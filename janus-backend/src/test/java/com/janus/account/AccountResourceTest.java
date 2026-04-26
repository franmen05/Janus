package com.janus.account;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;

/**
 * Tests for the PATCH /api/accounts/{id}/active endpoint and the activeOnly list filter.
 * Each test is self-contained and creates its own data — no ordering is required.
 */
@QuarkusTest
class AccountResourceTest {

    private static Long createAccount(String name, String taxId, String email) {
        return given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {
                            "name": "%s",
                            "taxId": "%s",
                            "email": "%s",
                            "accountTypes": ["COMPANY"]
                        }
                        """.formatted(name, taxId, email))
                .when().post("/api/accounts")
                .then()
                .statusCode(201)
                .body("active", is(true))
                .extract().jsonPath().getLong("id");
    }

    @Test
    void testSetActive_AsAdmin_Success() {
        var id = createAccount("SetActive Admin Corp", "RTN-SETACT-ADM-001", "setactiveadmin@test.com");

        // Deactivate
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("{\"active\": false}")
                .when().patch("/api/accounts/{id}/active", id)
                .then()
                .statusCode(200)
                .body("id", is(id.intValue()))
                .body("active", is(false));

        // Verify the change persisted
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/accounts/{id}", id)
                .then()
                .statusCode(200)
                .body("active", is(false));

        // Reactivate
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("{\"active\": true}")
                .when().patch("/api/accounts/{id}/active", id)
                .then()
                .statusCode(200)
                .body("active", is(true));
    }

    @Test
    void testSetActive_NotFound() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("{\"active\": false}")
                .when().patch("/api/accounts/999999/active")
                .then()
                .statusCode(404);
    }

    @Test
    void testSetActive_Forbidden_AsAgent() {
        var id = createAccount("SetActive Forbidden Corp", "RTN-SETACT-FBD-001", "setactivefbd@test.com");

        given()
                .auth().basic("agent", "agent123")
                .contentType(ContentType.JSON)
                .body("{\"active\": false}")
                .when().patch("/api/accounts/{id}/active", id)
                .then()
                .statusCode(403);
    }

    @Test
    void testList_ActiveOnly_FiltersInactive() {
        // Create a fresh account, then deactivate it — all in one test so it is self-contained.
        var id = createAccount("ActiveOnly Filter Corp", "RTN-ACTONLY-001", "actonly@test.com");

        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("{\"active\": false}")
                .when().patch("/api/accounts/{id}/active", id)
                .then()
                .statusCode(200)
                .body("active", is(false));

        var idInt = id.intValue();

        // With activeOnly=true: ensure inactive id is NOT present and all returned items are active
        // Use a large page to scan everything
        given()
                .auth().basic("admin", "admin123")
                .queryParam("activeOnly", true)
                .queryParam("size", 1000)
                .when().get("/api/accounts")
                .then()
                .statusCode(200)
                .body("content.id", not(hasItem(idInt)))
                .body("content.active", everyItem(is(true)));

        // Without activeOnly (omitted): the deactivated account IS present
        given()
                .auth().basic("admin", "admin123")
                .queryParam("size", 1000)
                .when().get("/api/accounts")
                .then()
                .statusCode(200)
                .body("content.id", hasItem(idInt))
                .body("totalElements", greaterThanOrEqualTo(1));

        // Sanity: results should not be empty
        given()
                .auth().basic("admin", "admin123")
                .queryParam("activeOnly", true)
                .queryParam("size", 1000)
                .when().get("/api/accounts")
                .then()
                .body("content", not(empty()));
    }
}
