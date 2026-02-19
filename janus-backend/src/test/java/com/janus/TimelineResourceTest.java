package com.janus;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TimelineResourceTest {

    private static Long operationId;

    private static File createTempPdf() {
        try {
            var tempFile = File.createTempFile("test-doc", ".pdf");
            tempFile.deleteOnExit();
            Files.write(tempFile.toPath(), "%PDF-1.4 test content".getBytes());
            return tempFile;
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private static void uploadDoc(Long opId, String docType) {
        given()
                .auth().basic("admin", "admin123")
                .multiPart("file", createTempPdf(), "application/pdf")
                .multiPart("documentType", docType)
                .when().post("/api/operations/{opId}/documents", opId)
                .then()
                .statusCode(201);
    }

    @Test
    @Order(1)
    void testSetup() {
        operationId = given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"clientId": 1, "transportMode": "AIR", "operationCategory": "CATEGORY_1", "blNumber": "BL-TEST-001", "blOriginalAvailable": true, "notes": "Timeline test"}
                        """)
                .when().post("/api/operations")
                .then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // Upload mandatory docs for compliance
        uploadDoc(operationId, "BL");
        uploadDoc(operationId, "COMMERCIAL_INVOICE");
        uploadDoc(operationId, "PACKING_LIST");

        // Change status
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"newStatus": "DOCUMENTATION_COMPLETE"}
                        """)
                .when().post("/api/operations/{id}/change-status", operationId)
                .then().statusCode(200);

        // Add a comment
        given()
                .auth().basic("admin", "admin123")
                .contentType(ContentType.JSON)
                .body("""
                        {"content": "Timeline test comment"}
                        """)
                .when().post("/api/operations/{opId}/comments", operationId)
                .then().statusCode(201);
    }

    @Test
    @Order(2)
    void testGetFullTimeline() {
        given()
                .auth().basic("admin", "admin123")
                .when().get("/api/operations/{opId}/timeline", operationId)
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(3))
                .body("eventType", hasItem("STATUS_CHANGE"))
                .body("eventType", hasItem("COMMENT"));
    }

    @Test
    @Order(3)
    void testFilterByStatusChange() {
        given()
                .auth().basic("admin", "admin123")
                .queryParam("type", "STATUS_CHANGE")
                .when().get("/api/operations/{opId}/timeline", operationId)
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(2))
                .body("eventType[0]", is("STATUS_CHANGE"));
    }

    @Test
    @Order(4)
    void testFilterByComment() {
        given()
                .auth().basic("admin", "admin123")
                .queryParam("type", "COMMENT")
                .when().get("/api/operations/{opId}/timeline", operationId)
                .then()
                .statusCode(200)
                .body("size()", is(1))
                .body("[0].eventType", is("COMMENT"));
    }

    @Test
    @Order(5)
    void testAccountingCanViewTimeline() {
        given()
                .auth().basic("accounting", "acc123")
                .when().get("/api/operations/{opId}/timeline", operationId)
                .then()
                .statusCode(200);
    }
}
