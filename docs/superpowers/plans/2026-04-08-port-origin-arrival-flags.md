# Port Origin/Arrival Flags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `originPort` and `arrivalPort` boolean flags to the Port entity so users can indicate a port's role, and filter operation form selects accordingly.

**Architecture:** Two boolean columns added to the `ports` table (default `true` for backward compatibility). The existing `GET /api/ports` endpoint gains an optional `type` query parameter for filtering. Frontend port list shows badges, port form adds checkboxes, and the operation form loads filtered port lists.

**Tech Stack:** Quarkus 3.27.2 (Java 21), Angular 20, Bootstrap 5

---

## File Map

### Backend (modify)
- `janus-backend/src/main/java/com/janus/port/domain/model/Port.java` — add two boolean fields
- `janus-backend/src/main/java/com/janus/port/api/dto/CreatePortRequest.java` — add two boolean params
- `janus-backend/src/main/java/com/janus/port/api/dto/PortResponse.java` — add two boolean fields to response
- `janus-backend/src/main/java/com/janus/port/domain/repository/PortRepository.java` — add filtered query methods
- `janus-backend/src/main/java/com/janus/port/application/PortService.java` — add filtered list methods, update create/update
- `janus-backend/src/main/java/com/janus/port/api/PortResource.java` — add `type` query param to `GET /api/ports`
- `janus-backend/src/main/java/com/janus/shared/infrastructure/DataSeeder.java` — set flags on seed ports

### Frontend (modify)
- `janus-frontend/src/app/core/models/port.model.ts` — add boolean fields to interfaces
- `janus-frontend/src/app/core/services/port.service.ts` — add `type` param to `getAll()`
- `janus-frontend/src/app/features/ports/port-form/port-form.component.ts` — add checkboxes
- `janus-frontend/src/app/features/ports/port-list/port-list.component.ts` — add Type column with badges
- `janus-frontend/src/app/features/operations/operation-form/operation-form.component.ts` — separate port signals, filtered loading
- `janus-frontend/src/assets/i18n/en.json` — add i18n keys
- `janus-frontend/src/assets/i18n/es.json` — add i18n keys

---

### Task 1: Backend — Add boolean fields to Port entity

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/port/domain/model/Port.java`

- [ ] **Step 1: Add `originPort` and `arrivalPort` fields to the entity**

```java
// Add after the `country` field (line 24):

@Column(nullable = false)
public boolean originPort = true;

@Column(nullable = false)
public boolean arrivalPort = true;
```

The full file should look like:

```java
package com.janus.port.domain.model;

import com.janus.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "ports")
public class Port extends BaseEntity {

    @Column(nullable = false, unique = true)
    public String code;

    @Column(nullable = false)
    public String name;

    @Column(columnDefinition = "TEXT")
    public String description;

    @Column(columnDefinition = "TEXT")
    public String address;

    @Column(length = 2)
    public String country;

    @Column(nullable = false)
    public boolean originPort = true;

    @Column(nullable = false)
    public boolean arrivalPort = true;
}
```

- [ ] **Step 2: Run backend build to verify entity compiles**

Run: `cd janus-backend && ./gradlew test`
Expected: All tests pass. Hibernate auto-DDL adds the two columns with default `true`.

- [ ] **Step 3: Commit**

```bash
git add janus-backend/src/main/java/com/janus/port/domain/model/Port.java
git commit -m "feat: add originPort and arrivalPort boolean fields to Port entity"
```

---

### Task 2: Backend — Update DTOs (CreatePortRequest + PortResponse)

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/port/api/dto/CreatePortRequest.java`
- Modify: `janus-backend/src/main/java/com/janus/port/api/dto/PortResponse.java`

- [ ] **Step 1: Update CreatePortRequest to include the two boolean fields**

Replace the entire file content:

```java
package com.janus.port.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CreatePortRequest(
        @NotBlank String code,
        @NotBlank String name,
        String description,
        String address,
        String country,
        Boolean originPort,
        Boolean arrivalPort
) {}
```

Note: `Boolean` (boxed) so they are optional on the request. The service will default to `true` if null.

- [ ] **Step 2: Update PortResponse to include the two boolean fields**

Replace the entire file content:

```java
package com.janus.port.api.dto;

import com.janus.port.domain.model.Port;
import java.time.LocalDateTime;

public record PortResponse(
        Long id,
        String code,
        String name,
        String description,
        String address,
        String country,
        boolean originPort,
        boolean arrivalPort,
        LocalDateTime createdAt
) {
    public static PortResponse from(Port port) {
        return new PortResponse(
                port.id,
                port.code,
                port.name,
                port.description,
                port.address,
                port.country,
                port.originPort,
                port.arrivalPort,
                port.createdAt
        );
    }
}
```

- [ ] **Step 3: Run tests**

Run: `cd janus-backend && ./gradlew test`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add janus-backend/src/main/java/com/janus/port/api/dto/CreatePortRequest.java janus-backend/src/main/java/com/janus/port/api/dto/PortResponse.java
git commit -m "feat: add originPort/arrivalPort to port DTOs"
```

---

### Task 3: Backend — Update PortRepository with filtered queries

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/port/domain/repository/PortRepository.java`

- [ ] **Step 1: Add two query methods for filtered port lists**

Add after the `findExistingCodes` method:

```java
public List<Port> findByOriginPort(boolean value) {
    return list("originPort", value);
}

public List<Port> findByArrivalPort(boolean value) {
    return list("arrivalPort", value);
}
```

Full file:

```java
package com.janus.port.domain.repository;

import com.janus.port.domain.model.Port;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class PortRepository implements PanacheRepository<Port> {

    public Optional<Port> findByCode(String code) {
        return find("code", code).firstResultOptional();
    }

    public List<String> findExistingCodes(List<String> codes) {
        if (codes == null || codes.isEmpty()) {
            return List.of();
        }
        return find("code in ?1", codes)
                .stream()
                .map(p -> p.code)
                .toList();
    }

    public List<Port> findByOriginPort(boolean value) {
        return list("originPort", value);
    }

    public List<Port> findByArrivalPort(boolean value) {
        return list("arrivalPort", value);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add janus-backend/src/main/java/com/janus/port/domain/repository/PortRepository.java
git commit -m "feat: add filtered query methods to PortRepository"
```

---

### Task 4: Backend — Update PortService (create, update, filtered list)

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/port/application/PortService.java`

- [ ] **Step 1: Add a `listByType` method and update `create`/`update` to handle the new fields**

Add this method after `listAll()`:

```java
public List<Port> listByType(String type) {
    if ("origin".equalsIgnoreCase(type)) {
        return portRepository.findByOriginPort(true);
    } else if ("arrival".equalsIgnoreCase(type)) {
        return portRepository.findByArrivalPort(true);
    }
    return portRepository.listAll();
}
```

In the `create` method, after `port.country = request.country();` (line 48), add:

```java
port.originPort = request.originPort() != null ? request.originPort() : true;
port.arrivalPort = request.arrivalPort() != null ? request.arrivalPort() : true;
```

In the `update` method, after `port.country = request.country();` (line 68), add:

```java
port.originPort = request.originPort() != null ? request.originPort() : port.originPort;
port.arrivalPort = request.arrivalPort() != null ? request.arrivalPort() : port.arrivalPort;
```

- [ ] **Step 2: Run tests**

Run: `cd janus-backend && ./gradlew test`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add janus-backend/src/main/java/com/janus/port/application/PortService.java
git commit -m "feat: add listByType and handle originPort/arrivalPort in create/update"
```

---

### Task 5: Backend — Update PortResource with type query param

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/port/api/PortResource.java`

- [ ] **Step 1: Add `@QueryParam` to the `list()` method**

Add import:

```java
import jakarta.ws.rs.QueryParam;
```

Change the `list()` method from:

```java
@GET
@RolesAllowed({"ADMIN", "AGENT"})
public List<PortResponse> list() {
    return portService.listAll().stream()
            .map(PortResponse::from)
            .toList();
}
```

To:

```java
@GET
@RolesAllowed({"ADMIN", "AGENT"})
public List<PortResponse> list(@QueryParam("type") String type) {
    return portService.listByType(type).stream()
            .map(PortResponse::from)
            .toList();
}
```

- [ ] **Step 2: Run tests**

Run: `cd janus-backend && ./gradlew test`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add janus-backend/src/main/java/com/janus/port/api/PortResource.java
git commit -m "feat: add type query param to GET /api/ports for filtering"
```

---

### Task 6: Backend — Update DataSeeder to set flags on seed ports

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/shared/infrastructure/DataSeeder.java`

- [ ] **Step 1: Update `createPort` helper and `seedPorts` to include flags**

Change the `createPort` method (lines 153-160) to:

```java
private void createPort(String code, String name, String description, String country, boolean originPort, boolean arrivalPort) {
    var port = new Port();
    port.code = code;
    port.name = name;
    port.description = description;
    port.country = country;
    port.originPort = originPort;
    port.arrivalPort = arrivalPort;
    portRepository.persist(port);
}
```

Update `seedPorts` (lines 146-151) to set meaningful defaults for Honduras ports:

```java
private void seedPorts() {
    createPort("HNPCR", "Puerto Cortés", "Principal puerto comercial de Honduras", "HN", true, true);
    createPort("HNLCE", "La Ceiba", "Puerto de La Ceiba", "HN", true, true);
    createPort("HNRTB", "Roatán", "Puerto de Roatán, Islas de la Bahía", "HN", false, true);
    createPort("HNTEA", "Tela", "Puerto de Tela", "HN", false, true);
}
```

Note: Roatán and Tela are set as arrival-only by default as an example. Adjust as needed.

- [ ] **Step 2: Run tests**

Run: `cd janus-backend && ./gradlew test`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add janus-backend/src/main/java/com/janus/shared/infrastructure/DataSeeder.java
git commit -m "feat: update DataSeeder to include port origin/arrival flags"
```

---

### Task 7: Frontend — Update port model and service

**Files:**
- Modify: `janus-frontend/src/app/core/models/port.model.ts`
- Modify: `janus-frontend/src/app/core/services/port.service.ts`

- [ ] **Step 1: Add boolean fields to Port and CreatePortRequest interfaces**

In `port.model.ts`, add to the `Port` interface after `country`:

```typescript
export interface Port {
  id: number;
  code: string;
  name: string;
  description: string | null;
  address: string | null;
  country: string | null;
  originPort: boolean;
  arrivalPort: boolean;
  createdAt: string;
}

export interface CreatePortRequest {
  code: string;
  name: string;
  description?: string;
  address?: string;
  country?: string;
  originPort?: boolean;
  arrivalPort?: boolean;
}
```

The rest of the file (`CatalogCountry`, `CatalogPort`, `BulkImportRequest`, `BulkImportResponse`) stays unchanged.

- [ ] **Step 2: Add optional `type` parameter to `getAll()` in PortService**

Change the `getAll` method in `port.service.ts` from:

```typescript
getAll(): Observable<Port[]> {
  return this.http.get<Port[]>(this.apiUrl);
}
```

To:

```typescript
getAll(type?: 'origin' | 'arrival'): Observable<Port[]> {
  const url = type ? `${this.apiUrl}?type=${type}` : this.apiUrl;
  return this.http.get<Port[]>(url);
}
```

- [ ] **Step 3: Verify build**

Run: `cd janus-frontend && npx ng build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add janus-frontend/src/app/core/models/port.model.ts janus-frontend/src/app/core/services/port.service.ts
git commit -m "feat: add originPort/arrivalPort to frontend port model and service"
```

---

### Task 8: Frontend — Update port form with checkboxes

**Files:**
- Modify: `janus-frontend/src/app/features/ports/port-form/port-form.component.ts`

- [ ] **Step 1: Add checkboxes to the form template and form controls**

Add two `FormControl` booleans to the `form` group. After the `country` control (line 64):

```typescript
originPort: new FormControl(true, { nonNullable: true }),
arrivalPort: new FormControl(true, { nonNullable: true })
```

Add checkbox HTML before the submit buttons. After the description textarea `</div>` (after line 41), add:

```html
<div class="row mb-3">
  <div class="col-md-6">
    <div class="form-check">
      <input type="checkbox" class="form-check-input" formControlName="originPort" id="originPort">
      <label class="form-check-label" for="originPort">{{ 'PORTS.ORIGIN_PORT' | translate }}</label>
    </div>
  </div>
  <div class="col-md-6">
    <div class="form-check">
      <input type="checkbox" class="form-check-input" formControlName="arrivalPort" id="arrivalPort">
      <label class="form-check-label" for="arrivalPort">{{ 'PORTS.ARRIVAL_PORT' | translate }}</label>
    </div>
  </div>
</div>
```

Update `ngOnInit` patchValue (line 73) to include the new fields:

```typescript
this.form.patchValue({
  code: p.code,
  name: p.name,
  description: p.description ?? '',
  address: p.address ?? '',
  country: p.country ?? '',
  originPort: p.originPort,
  arrivalPort: p.arrivalPort
});
```

Update `onSubmit` request building (line 81) to include the new fields:

```typescript
const request = {
  code: val.code,
  name: val.name,
  description: val.description || undefined,
  address: val.address || undefined,
  country: val.country || undefined,
  originPort: val.originPort,
  arrivalPort: val.arrivalPort
};
```

- [ ] **Step 2: Verify build**

Run: `cd janus-frontend && npx ng build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add janus-frontend/src/app/features/ports/port-form/port-form.component.ts
git commit -m "feat: add origin/arrival checkboxes to port form"
```

---

### Task 9: Frontend — Update port list table with Type badges column

**Files:**
- Modify: `janus-frontend/src/app/features/ports/port-list/port-list.component.ts`

- [ ] **Step 1: Add "Type" column header to the table**

In the `<thead>`, after the `PORTS.COUNTRY` header (line 43), add:

```html
<th>{{ 'PORTS.TYPE' | translate }}</th>
```

- [ ] **Step 2: Add Type badges cell in the `<tbody>`**

After the country cell `<td>{{ port.country ?? '-' }}</td>` (line 54), add:

```html
<td>
  @if (port.originPort) {
    <span class="badge bg-info me-1">{{ 'PORTS.BADGE_ORIGIN' | translate }}</span>
  }
  @if (port.arrivalPort) {
    <span class="badge bg-success">{{ 'PORTS.BADGE_ARRIVAL' | translate }}</span>
  }
</td>
```

- [ ] **Step 3: Update the colspan on the empty-state row**

Change `colspan="6"` to `colspan="7"` (line 65) to account for the new column.

- [ ] **Step 4: Verify build**

Run: `cd janus-frontend && npx ng build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add janus-frontend/src/app/features/ports/port-list/port-list.component.ts
git commit -m "feat: add Type column with origin/arrival badges to port list"
```

---

### Task 10: Frontend — Update operation form to use filtered port selects

**Files:**
- Modify: `janus-frontend/src/app/features/operations/operation-form/operation-form.component.ts`

- [ ] **Step 1: Replace single `ports` signal with two filtered signals**

In the component class, find the `ports` signal declaration and replace it with two signals:

```typescript
arrivalPorts = signal<Port[]>([]);
originPorts = signal<Port[]>([]);
```

- [ ] **Step 2: Update port loading in `ngOnInit` — edit mode (forkJoin)**

Replace the `ports: this.portService.getAll()` in the forkJoin (around line 311) with two calls:

```typescript
forkJoin({
  customers: this.customerService.getAll(),
  operation: this.operationService.getById(+id),
  arrivalPorts: this.portService.getAll('arrival'),
  originPorts: this.portService.getAll('origin')
}).subscribe(({ customers, operation: op, arrivalPorts, originPorts }) => {
  this.customers.set(customers);
  this.arrivalPorts.set(arrivalPorts);
  this.originPorts.set(originPorts);
  // ... rest of form patching stays the same
```

- [ ] **Step 3: Update port loading in `ngOnInit` — create mode**

Replace `this.portService.getAll().subscribe(ports => this.ports.set(ports));` (around line 351) with:

```typescript
forkJoin({
  arrivalPorts: this.portService.getAll('arrival'),
  originPorts: this.portService.getAll('origin')
}).subscribe(({ arrivalPorts, originPorts }) => {
  this.arrivalPorts.set(arrivalPorts);
  this.originPorts.set(originPorts);
});
```

Add `forkJoin` to the imports if not already present for the create-mode path.

- [ ] **Step 4: Update the template — arrival port select**

Change the arrival port `@for` loop (around line 152) from:

```html
@for (port of ports(); track port.id) {
```

To:

```html
@for (port of arrivalPorts(); track port.id) {
```

- [ ] **Step 5: Update the template — origin port select**

Change the origin port `@for` loop (around line 164) from:

```html
@for (port of ports(); track port.id) {
```

To:

```html
@for (port of originPorts(); track port.id) {
```

- [ ] **Step 6: Verify build**

Run: `cd janus-frontend && npx ng build`
Expected: Build succeeds with no references to the old `ports` signal.

- [ ] **Step 7: Commit**

```bash
git add janus-frontend/src/app/features/operations/operation-form/operation-form.component.ts
git commit -m "feat: filter operation form port selects by origin/arrival type"
```

---

### Task 11: Frontend — Add i18n keys

**Files:**
- Modify: `janus-frontend/src/assets/i18n/en.json`
- Modify: `janus-frontend/src/assets/i18n/es.json`

- [ ] **Step 1: Add new keys to `en.json` inside the `PORTS` section**

Add these keys inside the existing `"PORTS": { ... }` block:

```json
"ORIGIN_PORT": "Origin Port",
"ARRIVAL_PORT": "Arrival Port",
"TYPE": "Type",
"BADGE_ORIGIN": "Origin",
"BADGE_ARRIVAL": "Arrival"
```

- [ ] **Step 2: Add new keys to `es.json` inside the `PORTS` section**

Add these keys inside the existing `"PORTS": { ... }` block:

```json
"ORIGIN_PORT": "Puerto de Origen",
"ARRIVAL_PORT": "Puerto de Arribo",
"TYPE": "Tipo",
"BADGE_ORIGIN": "Origen",
"BADGE_ARRIVAL": "Arribo"
```

- [ ] **Step 3: Verify build**

Run: `cd janus-frontend && npx ng build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add janus-frontend/src/assets/i18n/en.json janus-frontend/src/assets/i18n/es.json
git commit -m "feat: add i18n keys for port origin/arrival flags"
```

---

### Task 12: Functional Testing (Playwright)

**Affected Areas:**

| Change | Affected Areas | Tests to Run |
|--------|---------------|--------------|
| Port entity + form checkboxes | Port create/edit form, port list table | Create port with flags, edit port flags, verify badges |
| Port list Type column | Port list display | Verify badges render correctly |
| Operation form filtered selects | Operation create/edit form | Create operation selecting filtered ports, edit operation |
| Bulk import (unchanged but ports default true) | Load ports modal | Verify imported ports show both badges |

- [ ] **Step 1: Start both backend and frontend**

Ensure `janus-backend` is running on `:8080` and `janus-frontend` on `:4200`.

- [ ] **Step 2: Test port list — verify Type column with badges**

1. Navigate to `http://localhost:4200/ports`
2. Take a snapshot — verify the "Type" column exists
3. Verify existing ports show `[Origin]` and `[Arrival]` badges (or equivalent in current language)

- [ ] **Step 3: Test port form — create port with flags**

1. Navigate to `http://localhost:4200/ports/new`
2. Verify both checkboxes ("Origin Port", "Arrival Port") are visible and checked by default
3. Fill in code, name; uncheck "Origin Port"; submit
4. Verify the new port in the list shows only the `[Arrival]` badge

- [ ] **Step 4: Test port form — edit port flags**

1. Click "Edit" on an existing port
2. Verify checkboxes reflect the port's current flags
3. Uncheck "Arrival Port", save
4. Verify updated badges in the list

- [ ] **Step 5: Test operation form — filtered arrival port select**

1. Navigate to `http://localhost:4200/operations/new`
2. Open the arrival port dropdown
3. Verify it only shows ports marked as arrival ports (ports with `arrivalPort=true`)
4. Verify ports marked as origin-only do NOT appear

- [ ] **Step 6: Test operation form — filtered origin port select**

1. Open the origin port dropdown
2. Verify it only shows ports marked as origin ports (ports with `originPort=true`)
3. Verify ports marked as arrival-only do NOT appear

- [ ] **Step 7: Test operation edit — existing port selections preserved**

1. Navigate to edit an existing operation that has ports assigned
2. Verify arrival port and origin port are correctly pre-selected
3. Verify the filtered dropdowns still contain the currently-selected ports

- [ ] **Step 8: Take final screenshots for evidence**
