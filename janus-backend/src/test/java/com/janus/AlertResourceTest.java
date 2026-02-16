package com.janus;

import com.janus.alert.application.AlertService;
import com.janus.alert.domain.model.AlertType;
import com.janus.operation.application.OperationService;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
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
class AlertResourceTest {

    @Inject
    AlertService alertService;

    @Inject
    OperationService operationService;

    private static Long operationId;
    private static Long alertId;

    @Test
    @Order(1)
    @Transactional
    void testSetupAndCreateAlert() {
        operationId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "cargoType": "LCL", "inspectionType": "EXPRESS"}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // Create an alert programmatically
        var operation = operationService.findById(operationId);
        var alert = alertService.createAlert(operation, AlertType.INACTIVITY_48H,
                "Test inactivity alert for operation " + operation.referenceNumber);
        if (alert != null) {
            alertId = alert.id;
        }
    }

    @Test
    @Order(2)
    void testGetActiveAlerts() {
        // Get the alert ID from the API
        var response = given()
                .auth().basic("admin", "admin123")
                .when().get("/api/alerts")
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1))
                .extract().jsonPath();

        if (alertId == null) {
            alertId = response.getLong("[0].id");
        }
    }

    @Test
    @Order(3)
    void testGetAlertsByOperation() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/alerts/operations/{opId}", operationId)
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1));
    }

    @Test
    @Order(4)
    void testAcknowledgeAlert() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .when().post("/api/alerts/{id}/acknowledge", alertId)
                .then()
                .statusCode(200)
                .body("status", is("ACKNOWLEDGED"))
                .body("acknowledgedBy", is("admin"))
                .body("acknowledgedAt", notNullValue());
    }

    @Test
    @Order(5)
    void testAcknowledgeAlreadyAcknowledged() {
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .when().post("/api/alerts/{id}/acknowledge", alertId)
                .then()
                .statusCode(400);
    }

    @Test
    @Order(6)
    void testClientCannotAccessAlerts() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/alerts")
                .then()
                .statusCode(403);
    }

    @Test
    @Order(7)
    void testAccountingCanViewOperationAlerts() {
        given()
                .auth().basic("accounting", "acc123")
                .when().get("/api/alerts/operations/{opId}", operationId)
                .then()
                .statusCode(200);
    }

    @Test
    @Order(8)
    void testCarrierCannotAccessAlerts() {
        given()
                .auth().basic("carrier", "carrier123")
                .when().get("/api/alerts")
                .then()
                .statusCode(403);
    }
}
