# Liquidation Approval Config Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make liquidation approval optional via a `LIQUIDATION_APPROVAL_REQUIRED` compliance config rule, allowing PRELIMINARY to skip directly to DEFINITIVE when disabled.

**Architecture:** Uses existing `ComplianceRuleConfig` system. Backend checks `isRuleEnabled("LIQUIDATION_APPROVAL_REQUIRED")` in `makeLiquidationDefinitive()` to allow PRELIMINARY → DEFINITIVE when disabled. A new lightweight endpoint exposes this config to the frontend. Frontend conditionally shows "Make Definitive" instead of "Approve" when approval is not required.

**Tech Stack:** Quarkus 3.27.2, Java 21, Angular 20, TypeScript, Bootstrap 5

---

### Task 1: Seed the compliance config

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/shared/infrastructure/DataSeeder.java:138` (add new config entry in `seedComplianceRuleConfigs()`)

**Step 1: Add the config entry**

In `seedComplianceRuleConfigs()`, after the last `createConfig(...)` call (line 137), add:

```java
createConfig("LIQUIDATION_APPROVAL_REQUIRED", "enabled", "true", "Requires ADMIN approval before liquidation can be made definitive");
```

**Step 2: Run tests**

```bash
cd janus-backend && ./gradlew test
```

Expected: All tests pass. No behavioral change yet — this just seeds the config.

**Step 3: Commit**

```bash
git add janus-backend/src/main/java/com/janus/shared/infrastructure/DataSeeder.java
git commit -m "feat: seed LIQUIDATION_APPROVAL_REQUIRED compliance config"
```

---

### Task 2: Backend — modify LiquidationService to check config

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/payment/application/LiquidationService.java:26-30` (add inject) and `:152-164` (modify `makeLiquidationDefinitive`)

**Step 1: Inject ComplianceRuleConfigRepository**

Add to imports:

```java
import com.janus.compliance.domain.repository.ComplianceRuleConfigRepository;
```

Add field after existing `@Inject` fields:

```java
@Inject
ComplianceRuleConfigRepository complianceRuleConfigRepository;
```

**Step 2: Modify `makeLiquidationDefinitive()`**

Replace the status check (lines 160-163):

```java
// Before:
if (liquidation.status != LiquidationStatus.APPROVED) {
    throw new BusinessException("LIQUIDATION_NOT_APPROVED",
            "Only APPROVED liquidations can be made definitive");
}

// After:
boolean approvalRequired = complianceRuleConfigRepository.isRuleEnabled("LIQUIDATION_APPROVAL_REQUIRED");
if (approvalRequired) {
    if (liquidation.status != LiquidationStatus.APPROVED) {
        throw new BusinessException("LIQUIDATION_NOT_APPROVED",
                "Only APPROVED liquidations can be made definitive");
    }
} else {
    if (liquidation.status != LiquidationStatus.PRELIMINARY && liquidation.status != LiquidationStatus.APPROVED) {
        throw new BusinessException("LIQUIDATION_NOT_PRELIMINARY",
                "Liquidation must be PRELIMINARY or APPROVED to be made definitive");
    }
}
```

**Step 3: Run tests**

```bash
cd janus-backend && ./gradlew test
```

Expected: All tests pass.

**Step 4: Commit**

```bash
git add janus-backend/src/main/java/com/janus/payment/application/LiquidationService.java
git commit -m "feat: check LIQUIDATION_APPROVAL_REQUIRED config before requiring approval"
```

---

### Task 3: Backend — add config query endpoint

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/payment/api/LiquidationResource.java` (add new GET endpoint)

**Step 1: Add import and inject**

Add to `LiquidationResource`:

```java
import com.janus.compliance.domain.repository.ComplianceRuleConfigRepository;
```

Add field:

```java
@Inject
ComplianceRuleConfigRepository complianceRuleConfigRepository;
```

**Step 2: Add the endpoint**

Add after the existing `getPayment` method (before class closing brace):

```java
@GET
@Path("/config")
@RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CLIENT"})
public Response getLiquidationConfig() {
    boolean approvalRequired = complianceRuleConfigRepository.isRuleEnabled("LIQUIDATION_APPROVAL_REQUIRED");
    return Response.ok(java.util.Map.of("approvalRequired", approvalRequired)).build();
}
```

Note: The endpoint is under `/api/operations/{operationId}/liquidation/config` since `LiquidationResource` is already at that path. The `operationId` param is not used but inherited from the class path.

**Step 3: Run tests**

```bash
cd janus-backend && ./gradlew test
```

Expected: All tests pass.

**Step 4: Commit**

```bash
git add janus-backend/src/main/java/com/janus/payment/api/LiquidationResource.java
git commit -m "feat: add liquidation config endpoint for approval-required check"
```

---

### Task 4: Frontend — add service method and update payment panel

**Files:**
- Modify: `janus-frontend/src/app/core/services/payment.service.ts` (add `getLiquidationConfig()`)
- Modify: `janus-frontend/src/app/features/operations/payment-panel/payment-panel.component.ts` (fetch config, conditional UI)

**Step 1: Add service method**

In `payment.service.ts`, add after `getPayment()`:

```typescript
getLiquidationConfig(operationId: number): Observable<{ approvalRequired: boolean }> {
  return this.http.get<{ approvalRequired: boolean }>(`${this.apiUrl}/api/operations/${operationId}/liquidation/config`);
}
```

**Step 2: Add signal in PaymentPanelComponent**

Add to the state signals section (after `saving = signal(false);`):

```typescript
approvalRequired = signal(true); // default: approval required
```

**Step 3: Fetch config in loadData()**

In `loadData()`, add after the existing `inspectionService.getCrossReference()` call:

```typescript
this.paymentService.getLiquidationConfig(id).subscribe({
  next: (config) => this.approvalRequired.set(config.approvalRequired),
  error: () => this.approvalRequired.set(true) // default to required on error
});
```

**Step 4: Update template — PRELIMINARY actions**

Replace the PRELIMINARY actions block (lines 252-264 in the template):

```html
@if (liquidation()!.status === 'PRELIMINARY' && canEdit()) {
  <div class="d-flex gap-2 flex-wrap">
    @if (approvalRequired()) {
      <button class="btn btn-success btn-sm" (click)="approve()" [disabled]="!authService.hasRole(['ADMIN'])">
        <i class="bi bi-check-circle me-1"></i>{{ 'PAYMENT.APPROVE' | translate }}
      </button>
    } @else {
      <button class="btn btn-primary btn-sm" (click)="makeDefinitive()" [disabled]="saving()">
        @if (saving()) {
          <span class="spinner-border spinner-border-sm me-1"></span>
        }
        {{ 'PAYMENT.MAKE_DEFINITIVE' | translate }}
      </button>
    }
    <button class="btn btn-outline-secondary btn-sm" (click)="regenerate()" [disabled]="generating()">
      @if (generating()) {
        <span class="spinner-border spinner-border-sm me-1"></span>
      }
      <i class="bi bi-arrow-clockwise me-1"></i>{{ 'PAYMENT.REGENERATE' | translate }}
    </button>
  </div>
}
```

**Step 5: Verify build**

```bash
cd janus-frontend && npx ng build
```

Expected: Build succeeds.

**Step 6: Commit**

```bash
git add janus-frontend/src/app/core/services/payment.service.ts janus-frontend/src/app/features/operations/payment-panel/payment-panel.component.ts
git commit -m "feat: conditionally show approval vs definitive based on config"
```

---

### Task 5: Backend test — verify behavior with config enabled and disabled

**Files:**
- Create: `janus-backend/src/test/java/com/janus/payment/LiquidationApprovalConfigTest.java`

**Step 1: Write integration test**

```java
package com.janus.payment;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class LiquidationApprovalConfigTest {

    @Test
    @Order(1)
    void testConfigEndpointReturnsApprovalRequired() {
        // The seeded config has LIQUIDATION_APPROVAL_REQUIRED enabled
        given()
                .auth().basic("agent", "agent123")
                .when().get("/api/operations/1/liquidation/config")
                .then()
                .statusCode(200)
                .body("approvalRequired", is(true));
    }

    @Test
    @Order(2)
    void testConfigEndpointAccessibleByClient() {
        given()
                .auth().basic("client", "client123")
                .when().get("/api/operations/1/liquidation/config")
                .then()
                .statusCode(200)
                .body("approvalRequired", is(true));
    }

    @Test
    @Order(3)
    void testConfigEndpointRequiresAuth() {
        given()
                .when().get("/api/operations/1/liquidation/config")
                .then()
                .statusCode(401);
    }
}
```

**Step 2: Run tests**

```bash
cd janus-backend && ./gradlew test
```

Expected: All tests pass, including new ones.

**Step 3: Commit**

```bash
git add janus-backend/src/test/java/com/janus/payment/LiquidationApprovalConfigTest.java
git commit -m "test: add liquidation approval config endpoint tests"
```

---

### Task 6: Final verification

**Step 1: Run full backend tests**

```bash
cd janus-backend && ./gradlew test
```

**Step 2: Run frontend build**

```bash
cd janus-frontend && npx ng build
```

Expected: Both pass cleanly.
