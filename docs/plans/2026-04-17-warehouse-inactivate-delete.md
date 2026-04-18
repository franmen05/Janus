# Warehouse: Inactivar y Eliminar — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add inactivate (soft-disable) and delete (conditional hard-delete) capabilities to warehouses, plus change `paisOrigen` to a country select.

**Architecture:** Add `boolean active = true` to the `Warehouse` entity (same as `User.active`). DELETE is physical but guarded by a 409 if the warehouse has operations. A new `ConflictException` is added to the exception mapper. The `paisOrigen` field on the form becomes a `<select>` using the existing `/api/ports/catalog/countries` endpoint.

**Tech Stack:** Quarkus 3.27.2 / Java 21 / Panache, Angular 20 / Bootstrap 5 / signals / ReactiveFormsModule

---

## Task 1: DB Migration — add `active` column

**Files:**
- Create: `janus-backend/src/main/resources/db/migration/V5__add_warehouse_active.sql`
- Create: `janus-backend/src/main/resources/db/h2/V5__add_warehouse_active.sql`

**Step 1: Create PostgreSQL migration**

```sql
-- V5__add_warehouse_active.sql
ALTER TABLE depositos ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;
```

**Step 2: Create H2 migration (identical content)**

Same content — copy exactly. H2 supports the same syntax.

**Step 3: Verify files exist**

```bash
ls janus-backend/src/main/resources/db/migration/V5*
ls janus-backend/src/main/resources/db/h2/V5*
```

**Step 4: Commit**

```bash
git add janus-backend/src/main/resources/db/migration/V5__add_warehouse_active.sql \
        janus-backend/src/main/resources/db/h2/V5__add_warehouse_active.sql
git commit -m "feat: migration V5 add active column to warehouses"
```

---

## Task 2: Backend — add `active` field to Warehouse entity and DTO

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/warehouse/domain/model/Warehouse.java`
- Modify: `janus-backend/src/main/java/com/janus/warehouse/api/dto/WarehouseResponse.java`

**Step 1: Add field to entity**

In `Warehouse.java`, add after `paisOrigen`:

```java
@Column(nullable = false)
public boolean active = true;
```

**Step 2: Add field to WarehouseResponse record**

Add `boolean active` to the record components (after `paisOrigen`, before `createdAt`):

```java
public record WarehouseResponse(
        Long id,
        String code,
        String name,
        String description,
        Integer secuencia,
        String tipoLocalizacion,
        String centroLogistico,
        String ubicacionArea,
        String paisOrigen,
        boolean active,
        LocalDateTime createdAt
) {
    public static WarehouseResponse from(Warehouse warehouse) {
        return new WarehouseResponse(
                warehouse.id,
                warehouse.code,
                warehouse.name,
                warehouse.description,
                warehouse.secuencia,
                warehouse.tipoLocalizacion,
                warehouse.centroLogistico,
                warehouse.ubicacionArea,
                warehouse.paisOrigen,
                warehouse.active,
                warehouse.createdAt
        );
    }
}
```

**Step 3: Compile check**

```bash
cd janus-backend && ./gradlew compileJava
```
Expected: `BUILD SUCCESSFUL`

**Step 4: Commit**

```bash
git add janus-backend/src/main/java/com/janus/warehouse/domain/model/Warehouse.java \
        janus-backend/src/main/java/com/janus/warehouse/api/dto/WarehouseResponse.java
git commit -m "feat: add active field to Warehouse entity and DTO"
```

---

## Task 3: Backend — add `ConflictException` and update exception mapper

**Files:**
- Create: `janus-backend/src/main/java/com/janus/shared/infrastructure/exception/ConflictException.java`
- Modify: `janus-backend/src/main/java/com/janus/shared/infrastructure/exception/GlobalExceptionMapper.java`

**Step 1: Create ConflictException**

```java
package com.janus.shared.infrastructure.exception;

public class ConflictException extends RuntimeException {

    private final String errorCode;

    public ConflictException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
```

**Step 2: Add handler in GlobalExceptionMapper**

Add this block inside `toResponse()`, before the `ConstraintViolationException` handler:

```java
if (exception instanceof ConflictException ce) {
    return Response.status(Response.Status.CONFLICT)
            .entity(Map.of("error", ce.getMessage(), "errorCode", ce.getErrorCode()))
            .build();
}
```

**Step 3: Compile check**

```bash
cd janus-backend && ./gradlew compileJava
```
Expected: `BUILD SUCCESSFUL`

**Step 4: Commit**

```bash
git add janus-backend/src/main/java/com/janus/shared/infrastructure/exception/ConflictException.java \
        janus-backend/src/main/java/com/janus/shared/infrastructure/exception/GlobalExceptionMapper.java
git commit -m "feat: add ConflictException with 409 response and mapper"
```

---

## Task 4: Backend — add query and count methods to repositories

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/warehouse/domain/repository/WarehouseRepository.java`
- Modify: `janus-backend/src/main/java/com/janus/operation/domain/repository/OperationRepository.java`

**Step 1: Add active-filter query to WarehouseRepository**

```java
public List<Warehouse> listActive() {
    return list("active = true ORDER BY secuencia ASC NULLS LAST, name ASC");
}

public List<Warehouse> listAll() {
    return list("ORDER BY secuencia ASC NULLS LAST, name ASC");
}
```

Note: the `listAll()` override adds ordering. `PanacheRepository.listAll()` is a method of the parent — you can shadow it with a named query instead. Replace the method with:

```java
public List<Warehouse> findAllOrdered() {
    return list("ORDER BY secuencia ASC NULLS LAST, name ASC");
}

public List<Warehouse> findAllActive() {
    return list("active = true ORDER BY secuencia ASC NULLS LAST, name ASC");
}
```

**Step 2: Add count-by-warehouse to OperationRepository**

```java
public long countByWarehouseId(Long warehouseId) {
    return count("warehouse.id", warehouseId);
}
```

**Step 3: Compile check**

```bash
cd janus-backend && ./gradlew compileJava
```

**Step 4: Commit**

```bash
git add janus-backend/src/main/java/com/janus/warehouse/domain/repository/WarehouseRepository.java \
        janus-backend/src/main/java/com/janus/operation/domain/repository/OperationRepository.java
git commit -m "feat: add active-filter and operation-count queries to repositories"
```

---

## Task 5: Backend — update WarehouseService (filter, toggleActive, delete)

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/warehouse/application/WarehouseService.java`

**Step 1: Update imports**

Add these imports:

```java
import com.janus.operation.domain.repository.OperationRepository;
import com.janus.shared.infrastructure.exception.ConflictException;
```

**Step 2: Inject OperationRepository**

```java
@Inject
OperationRepository operationRepository;
```

**Step 3: Replace `listAll()` with filtered version**

```java
public List<Warehouse> listAll(boolean includeInactive) {
    if (includeInactive) {
        return warehouseRepository.findAllOrdered();
    }
    return warehouseRepository.findAllActive();
}
```

**Step 4: Add `toggleActive` method**

```java
@Transactional
public Warehouse toggleActive(Long id, String username) {
    var warehouse = findById(id);
    warehouse.active = !warehouse.active;
    var action = warehouse.active ? "activated" : "deactivated";
    auditEvent.fire(new AuditEvent(username, AuditAction.UPDATE, "Warehouse", warehouse.id, null, null, null,
            "Warehouse " + action + ": " + warehouse.name));
    return warehouse;
}
```

**Step 5: Add `delete` method**

```java
@Transactional
public void delete(Long id, String username) {
    var warehouse = findById(id);
    long opCount = operationRepository.countByWarehouseId(id);
    if (opCount > 0) {
        throw new ConflictException("WAREHOUSE_HAS_OPERATIONS",
                "Cannot delete warehouse with existing operations: " + warehouse.code);
    }
    auditEvent.fire(new AuditEvent(username, AuditAction.DELETE, "Warehouse", warehouse.id, null, null, null,
            "Warehouse deleted: " + warehouse.name));
    warehouseRepository.delete(warehouse);
}
```

**Step 6: Compile check**

```bash
cd janus-backend && ./gradlew compileJava
```
Expected: `BUILD SUCCESSFUL`

**Step 7: Commit**

```bash
git add janus-backend/src/main/java/com/janus/warehouse/application/WarehouseService.java
git commit -m "feat: add toggleActive and delete to WarehouseService"
```

---

## Task 6: Backend — update WarehouseResource (new endpoints)

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/warehouse/api/WarehouseResource.java`

**Step 1: Update imports**

Add:

```java
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Response;
```

**Step 2: Update `list()` to accept `includeInactive` query param**

```java
@GET
@RolesAllowed({"SUPERVISOR", "ADMIN", "AGENT"})
public List<WarehouseResponse> list(@QueryParam("includeInactive") boolean includeInactive) {
    return warehouseService.listAll(includeInactive).stream()
            .map(WarehouseResponse::from)
            .toList();
}
```

**Step 3: Add `toggleActive` endpoint**

```java
@PATCH
@Path("/{id}/toggle-active")
@RolesAllowed({"SUPERVISOR", "ADMIN"})
public WarehouseResponse toggleActive(@PathParam("id") Long id, @Context SecurityContext sec) {
    return WarehouseResponse.from(warehouseService.toggleActive(id, sec.getUserPrincipal().getName()));
}
```

**Step 4: Add `delete` endpoint**

```java
@DELETE
@Path("/{id}")
@RolesAllowed({"SUPERVISOR", "ADMIN"})
public Response delete(@PathParam("id") Long id, @Context SecurityContext sec) {
    warehouseService.delete(id, sec.getUserPrincipal().getName());
    return Response.noContent().build();
}
```

**Step 5: Run tests**

```bash
cd janus-backend && ./gradlew test
```
Expected: `BUILD SUCCESSFUL` (pre-existing port conflict failure for `AccountResourceTest` is unrelated)

**Step 6: Commit**

```bash
git add janus-backend/src/main/java/com/janus/warehouse/api/WarehouseResource.java
git commit -m "feat: add toggle-active and delete endpoints to WarehouseResource"
```

---

## Task 7: Frontend — update model and service

**Files:**
- Modify: `janus-frontend/src/app/core/models/warehouse.model.ts`
- Modify: `janus-frontend/src/app/core/services/warehouse.service.ts`

**Step 1: Add `active` field to Warehouse interface**

In `warehouse.model.ts`, add `active: boolean;` to the `Warehouse` interface (after `paisOrigen`):

```typescript
export interface Warehouse {
  id: number;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
  secuencia: number | null;
  tipoLocalizacion: string | null;
  centroLogistico: string | null;
  ubicacionArea: string | null;
  paisOrigen: string | null;
  active: boolean;
}
```

**Step 2: Update WarehouseService**

Replace the entire `warehouse.service.ts` content:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Warehouse, CreateWarehouseRequest } from '../models/warehouse.model';

@Injectable({ providedIn: 'root' })
export class WarehouseService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/warehouses`;

  getAll(includeInactive = false): Observable<Warehouse[]> {
    const params = includeInactive ? { includeInactive: 'true' } : {};
    return this.http.get<Warehouse[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Warehouse> {
    return this.http.get<Warehouse>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateWarehouseRequest): Observable<Warehouse> {
    return this.http.post<Warehouse>(this.apiUrl, request);
  }

  update(id: number, request: CreateWarehouseRequest): Observable<Warehouse> {
    return this.http.put<Warehouse>(`${this.apiUrl}/${id}`, request);
  }

  toggleActive(id: number): Observable<Warehouse> {
    return this.http.patch<Warehouse>(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

**Step 3: Commit**

```bash
git add janus-frontend/src/app/core/models/warehouse.model.ts \
        janus-frontend/src/app/core/services/warehouse.service.ts
git commit -m "feat: add active field and toggleActive/delete methods to warehouse model/service"
```

---

## Task 8: Frontend i18n — add new keys

**Files:**
- Modify: `janus-frontend/src/assets/i18n/en.json`
- Modify: `janus-frontend/src/assets/i18n/es.json`

**Step 1: Add to en.json WAREHOUSES section**

Find the `"WAREHOUSES"` object and add these keys:

```json
"SHOW_INACTIVE": "Show inactive",
"INACTIVE_BADGE": "Inactive",
"INACTIVATE": "Inactivate",
"ACTIVATE": "Activate",
"DELETE": "Delete",
"CONFIRM_DELETE": "Are you sure you want to delete this warehouse?",
"CONFIRM_INACTIVATE": "Are you sure you want to inactivate this warehouse?"
```

**Step 2: Add to en.json ERRORS section**

Find the `"ERRORS"` object and add:

```json
"WAREHOUSE_HAS_OPERATIONS": "This warehouse cannot be deleted because it has associated operations."
```

**Step 3: Add to es.json WAREHOUSES section**

```json
"SHOW_INACTIVE": "Mostrar inactivos",
"INACTIVE_BADGE": "Inactivo",
"INACTIVATE": "Inactivar",
"ACTIVATE": "Activar",
"DELETE": "Eliminar",
"CONFIRM_DELETE": "¿Está seguro de que desea eliminar este almacén?",
"CONFIRM_INACTIVATE": "¿Está seguro de que desea inactivar este almacén?"
```

**Step 4: Add to es.json ERRORS section**

```json
"WAREHOUSE_HAS_OPERATIONS": "Este almacén no puede eliminarse porque tiene operaciones asociadas."
```

**Step 5: Commit**

```bash
git add janus-frontend/src/assets/i18n/en.json \
        janus-frontend/src/assets/i18n/es.json
git commit -m "feat: add i18n keys for warehouse inactivate/delete"
```

---

## Task 9: Frontend — update warehouse-list component

**Files:**
- Modify: `janus-frontend/src/app/features/warehouses/warehouse-list/warehouse-list.component.ts`

**Step 1: Replace the component with this full implementation**

Key changes:
- Add `showInactive = signal(false)` toggle
- `getAll(showInactive())` call
- Inactive rows get `table-secondary opacity-50` class
- Add "Inactive" badge in the name cell
- Add Inactivate/Activate button per row (ADMIN/SUPERVISOR only)
- Add Delete button per row (ADMIN/SUPERVISOR only)
- On error from delete → show alert with translated errorCode

```typescript
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { Warehouse } from '../../../core/models/warehouse.model';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingIndicatorComponent } from '../../../shared/components/loading-indicator/loading-indicator.component';

@Component({
  selector: 'app-warehouse-list',
  standalone: true,
  imports: [RouterModule, FormsModule, TranslateModule, LoadingIndicatorComponent],
  template: `
    <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
      <h2>{{ 'WAREHOUSES.TITLE' | translate }}</h2>
      <div class="d-flex gap-3 align-items-center">
        <div class="form-check form-switch mb-0">
          <input class="form-check-input" type="checkbox" id="showInactiveToggle"
                 [checked]="showInactive()"
                 (change)="toggleShowInactive()">
          <label class="form-check-label" for="showInactiveToggle">{{ 'WAREHOUSES.SHOW_INACTIVE' | translate }}</label>
        </div>
        @if (authService.hasRole(['ADMIN', 'SUPERVISOR'])) {
          <a routerLink="/warehouses/new" class="btn btn-primary">{{ 'WAREHOUSES.NEW' | translate }}</a>
        }
      </div>
    </div>
    @if (loading()) {
      <app-loading-indicator />
    } @else {
    <div class="card">
      <div class="card-header">
        <input type="text" class="form-control"
               [placeholder]="'WAREHOUSES.SEARCH' | translate"
               [ngModel]="searchTerm()"
               (ngModelChange)="searchTerm.set($event)">
      </div>
      <div class="card-body p-0 table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>{{ 'WAREHOUSES.CODE' | translate }}</th>
              <th>{{ 'WAREHOUSES.NAME' | translate }}</th>
              <th class="d-none d-md-table-cell">{{ 'WAREHOUSES.DESCRIPTION' | translate }}</th>
              <th class="d-none d-lg-table-cell">{{ 'WAREHOUSES.SECUENCIA' | translate }}</th>
              <th class="d-none d-lg-table-cell">{{ 'WAREHOUSES.TIPO_LOCALIZACION' | translate }}</th>
              <th class="d-none d-xl-table-cell">{{ 'WAREHOUSES.CENTRO_LOGISTICO' | translate }}</th>
              <th class="d-none d-xl-table-cell">{{ 'WAREHOUSES.PAIS_ORIGEN' | translate }}</th>
              <th>{{ 'COMMON.ACTIONS' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (dep of filteredWarehouses(); track dep.id) {
              <tr [class.table-secondary]="!dep.active" [class.opacity-75]="!dep.active">
                <td class="fw-bold">{{ dep.code }}</td>
                <td>
                  {{ dep.name }}
                  @if (!dep.active) {
                    <span class="badge bg-secondary ms-1">{{ 'WAREHOUSES.INACTIVE_BADGE' | translate }}</span>
                  }
                </td>
                <td class="d-none d-md-table-cell text-truncate" style="max-width: 300px;" [title]="dep.description ?? ''">{{ dep.description ?? '-' }}</td>
                <td class="d-none d-lg-table-cell">{{ dep.secuencia ?? '-' }}</td>
                <td class="d-none d-lg-table-cell">{{ dep.tipoLocalizacion ?? '-' }}</td>
                <td class="d-none d-xl-table-cell">{{ dep.centroLogistico ?? '-' }}</td>
                <td class="d-none d-xl-table-cell">{{ dep.paisOrigen ?? '-' }}</td>
                <td>
                  <div class="d-flex gap-1 flex-wrap">
                    @if (authService.hasRole(['ADMIN', 'SUPERVISOR'])) {
                      <a [routerLink]="['/warehouses', dep.id, 'edit']" class="btn btn-sm btn-outline-primary">{{ 'ACTIONS.EDIT' | translate }}</a>
                      <button class="btn btn-sm btn-outline-warning" (click)="onToggleActive(dep)">
                        {{ (dep.active ? 'WAREHOUSES.INACTIVATE' : 'WAREHOUSES.ACTIVATE') | translate }}
                      </button>
                      <button class="btn btn-sm btn-outline-danger" (click)="onDelete(dep)">
                        {{ 'WAREHOUSES.DELETE' | translate }}
                      </button>
                    }
                  </div>
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="8" class="text-center text-muted py-3">{{ 'WAREHOUSES.NO_WAREHOUSES' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
    }
  `
})
export class WarehouseListComponent implements OnInit {
  private warehouseService = inject(WarehouseService);
  private translate = inject(TranslateService);
  authService = inject(AuthService);
  loading = signal(true);
  warehouses = signal<Warehouse[]>([]);
  searchTerm = signal('');
  showInactive = signal(false);

  filteredWarehouses = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.warehouses();
    return this.warehouses().filter(d =>
      d.code.toLowerCase().includes(term) ||
      d.name.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadWarehouses();
  }

  toggleShowInactive(): void {
    this.showInactive.update(v => !v);
    this.loadWarehouses();
  }

  onToggleActive(warehouse: Warehouse): void {
    const key = warehouse.active ? 'WAREHOUSES.CONFIRM_INACTIVATE' : 'WAREHOUSES.ACTIVATE';
    if (warehouse.active && !confirm(this.translate.instant('WAREHOUSES.CONFIRM_INACTIVATE'))) return;
    this.warehouseService.toggleActive(warehouse.id).subscribe(() => this.loadWarehouses());
  }

  onDelete(warehouse: Warehouse): void {
    if (!confirm(this.translate.instant('WAREHOUSES.CONFIRM_DELETE'))) return;
    this.warehouseService.delete(warehouse.id).subscribe({
      next: () => this.loadWarehouses(),
      error: (err) => {
        const errorCode = err.error?.errorCode;
        const message = errorCode
          ? this.translate.instant('ERRORS.' + errorCode)
          : (err.error?.error ?? this.translate.instant('ERRORS.GENERIC_ERROR'));
        alert(message);
      }
    });
  }

  private loadWarehouses(): void {
    this.loading.set(true);
    this.warehouseService.getAll(this.showInactive()).subscribe(warehouses => {
      this.warehouses.set(warehouses);
      this.loading.set(false);
    });
  }
}
```

**Step 2: Commit**

```bash
git add janus-frontend/src/app/features/warehouses/warehouse-list/warehouse-list.component.ts
git commit -m "feat: add inactivate/delete UI to warehouse list"
```

---

## Task 10: Frontend — update warehouse-form (paisOrigen → select)

**Files:**
- Modify: `janus-frontend/src/app/features/warehouses/warehouse-form/warehouse-form.component.ts`

**Step 1: Load countries from API**

The endpoint `GET /api/ports/catalog/countries` (roles: ADMIN) returns `CatalogCountryResponse[]` with shape `{ code: string, name: string }`.

Add to the component:

```typescript
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
```

Add field and load in `ngOnInit`:

```typescript
private http = inject(HttpClient);
countries = signal<{ code: string; name: string }[]>([]);
```

In `ngOnInit`, before the id check:

```typescript
this.http.get<{ code: string; name: string }[]>(
  `${environment.apiUrl}/api/ports/catalog/countries`
).subscribe(c => this.countries.set(c));
```

**Step 2: Replace `paisOrigen` input with select in template**

Find this block in the template:

```html
<div class="col-md-4">
  <label class="form-label">{{ 'WAREHOUSES.PAIS_ORIGEN' | translate }}</label>
  <input type="text" class="form-control" formControlName="paisOrigen">
</div>
```

Replace with:

```html
<div class="col-md-4">
  <label class="form-label">{{ 'WAREHOUSES.PAIS_ORIGEN' | translate }}</label>
  <select class="form-select" formControlName="paisOrigen">
    <option [ngValue]="null">—</option>
    @for (country of countries(); track country.code) {
      <option [value]="country.code">{{ country.name }}</option>
    }
  </select>
</div>
```

Note: `ngValue` requires `ReactiveFormsModule` which is already imported.

**Step 3: Build check**

```bash
cd janus-frontend && npx ng build
```
Expected: `Build at` line with no errors (bundle warning pre-exists).

**Step 4: Commit**

```bash
git add janus-frontend/src/app/features/warehouses/warehouse-form/warehouse-form.component.ts
git commit -m "feat: replace paisOrigen text input with country select in warehouse form"
```

---

## Task 11: Final verification

**Step 1: Run backend tests**

```bash
cd janus-backend && ./gradlew test
```
Expected: `BUILD SUCCESSFUL` (pre-existing `AccountResourceTest` port failure is unrelated)

**Step 2: Run frontend build**

```bash
cd janus-frontend && npx ng build
```
Expected: `Build at` success line.

**Step 3: Functional test checklist (manual or Playwright)**

- Navigate to `/warehouses` — list loads, "Show inactive" toggle visible
- Click "Inactivate" on a warehouse → row grays out, badge "Inactive" appears
- Enable "Show inactive" → inactive warehouses appear
- Click "Activate" → warehouse returns to active
- Click "Delete" on a warehouse without operations → row disappears
- Click "Delete" on a warehouse with operations → alert shows `ERRORS.WAREHOUSE_HAS_OPERATIONS` message
- Navigate to `/warehouses/new` → `paisOrigen` is a dropdown of countries
