# Pagination Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add pagination to all list views. Server-side for customers, operations, and exchange rates. Client-side for ports and users.

**Architecture:** A shared `PageResponse<T>` record on the backend provides consistent paginated responses. On the frontend, a shared `PaginationComponent` (using `ngb-pagination`) is used across all list views. Server-side pagination uses Panache `find().page()` with `LOWER(field) LIKE` for search. Client-side pagination slices the already-loaded array.

**Tech Stack:** Quarkus Panache (backend pagination), Angular signals + ngb-pagination (frontend)

---

### Task 1: Backend — Create shared PageResponse DTO

**Files:**
- Create: `janus-backend/src/main/java/com/janus/shared/api/dto/PageResponse.java`

**Step 1: Create the PageResponse record**

```java
package com.janus.shared.api.dto;

import java.util.List;

public record PageResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages
) {
    public static <T> PageResponse<T> of(List<T> content, int page, int size, long totalElements) {
        int totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;
        return new PageResponse<>(content, page, size, totalElements, totalPages);
    }
}
```

**Step 2: Run tests to verify nothing breaks**

Run: `cd janus-backend && ./gradlew test`
Expected: All existing tests PASS (new file only, no changes)

**Step 3: Commit**

```bash
git add janus-backend/src/main/java/com/janus/shared/api/dto/PageResponse.java
git commit -m "feat: add shared PageResponse DTO for pagination"
```

---

### Task 2: Backend — Add server-side pagination to Customers

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/customer/domain/repository/CustomerRepository.java`
- Modify: `janus-backend/src/main/java/com/janus/customer/application/CustomerService.java`
- Modify: `janus-backend/src/main/java/com/janus/customer/api/CustomerResource.java`

**Step 1: Add paginated search to CustomerRepository**

In `CustomerRepository.java`, add method:

```java
import io.quarkus.panache.common.Page;

public List<Customer> findPaginated(String search, int page, int size) {
    if (search != null && !search.isBlank()) {
        var pattern = "%" + search.toLowerCase() + "%";
        return find("LOWER(name) LIKE ?1 OR LOWER(taxId) LIKE ?1 OR LOWER(customerCode) LIKE ?1", pattern)
                .page(Page.of(page, size))
                .list();
    }
    return findAll().page(Page.of(page, size)).list();
}

public long countFiltered(String search) {
    if (search != null && !search.isBlank()) {
        var pattern = "%" + search.toLowerCase() + "%";
        return count("LOWER(name) LIKE ?1 OR LOWER(taxId) LIKE ?1 OR LOWER(customerCode) LIKE ?1", pattern);
    }
    return count();
}
```

**Step 2: Add paginated method to CustomerService**

In `CustomerService.java`, add method (keep existing `listAll()` for backward compatibility with other usages like typeahead):

```java
@Transactional
public PageResponse<CustomerResponse> listPaginated(String search, int page, int size) {
    var customers = customerRepository.findPaginated(search, page, size);
    customers.forEach(c -> c.contacts.size()); // force lazy init
    var total = customerRepository.countFiltered(search);
    var content = customers.stream().map(CustomerResponse::from).toList();
    return PageResponse.of(content, page, size, total);
}
```

Add imports:
```java
import com.janus.shared.api.dto.PageResponse;
import com.janus.customer.api.dto.CustomerResponse;
```

**Step 3: Update CustomerResource list endpoint**

Replace the existing `list()` method:

```java
@GET
public PageResponse<CustomerResponse> list(
        @QueryParam("page") @DefaultValue("0") int page,
        @QueryParam("size") @DefaultValue("10") int size,
        @QueryParam("search") String search) {
    return customerService.listPaginated(search, page, size);
}
```

Add imports:
```java
import com.janus.shared.api.dto.PageResponse;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.QueryParam;
```

Remove unused `List` import if no longer needed.

**Step 4: Run tests**

Run: `cd janus-backend && ./gradlew test`
Expected: PASS. Existing tests may need adjustment if they assert on `List<CustomerResponse>` — the response structure changed to `PageResponse`.

**Step 5: Commit**

```bash
git add janus-backend/src/main/java/com/janus/customer/
git commit -m "feat: add server-side pagination to customers endpoint"
```

---

### Task 3: Backend — Add server-side pagination to Operations

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/operation/domain/repository/OperationRepository.java`
- Modify: `janus-backend/src/main/java/com/janus/operation/application/OperationService.java`
- Modify: `janus-backend/src/main/java/com/janus/operation/api/OperationResource.java`

**Step 1: Add paginated search to OperationRepository**

In `OperationRepository.java`, add methods:

```java
import io.quarkus.panache.common.Page;

public List<Operation> findPaginated(OperationStatus status, Long customerId, String search, int page, int size) {
    var query = buildFilterQuery(status, customerId, search);
    var params = buildFilterParams(status, customerId, search);
    if (query.isEmpty()) {
        return findAll().page(Page.of(page, size)).list();
    }
    return find(String.join(" AND ", query), params.toArray())
            .page(Page.of(page, size))
            .list();
}

public long countFiltered(OperationStatus status, Long customerId, String search) {
    var query = buildFilterQuery(status, customerId, search);
    var params = buildFilterParams(status, customerId, search);
    if (query.isEmpty()) {
        return count();
    }
    return count(String.join(" AND ", query), params.toArray());
}

private java.util.List<String> buildFilterQuery(OperationStatus status, Long customerId, String search) {
    var clauses = new java.util.ArrayList<String>();
    int paramIndex = 1;
    if (status != null) {
        clauses.add("status = ?" + paramIndex);
    }
    if (customerId != null) {
        clauses.add("customer.id = ?" + (status != null ? 2 : 1));
    }
    if (search != null && !search.isBlank()) {
        int idx = 1 + (status != null ? 1 : 0) + (customerId != null ? 1 : 0);
        clauses.add("(LOWER(referenceNumber) LIKE ?" + idx + " OR LOWER(customer.name) LIKE ?" + idx + " OR LOWER(blNumber) LIKE ?" + idx + ")");
    }
    return clauses;
}

private java.util.List<Object> buildFilterParams(OperationStatus status, Long customerId, String search) {
    var params = new java.util.ArrayList<>();
    if (status != null) params.add(status);
    if (customerId != null) params.add(customerId);
    if (search != null && !search.isBlank()) params.add("%" + search.toLowerCase() + "%");
    return params;
}
```

**Step 2: Add paginated method to OperationService**

In `OperationService.java`, add:

```java
import com.janus.shared.api.dto.PageResponse;
import com.janus.operation.api.dto.OperationResponse;

public PageResponse<OperationResponse> listPaginated(OperationStatus status, Long customerId, String search, int page, int size) {
    var operations = operationRepository.findPaginated(status, customerId, search, page, size);
    var total = operationRepository.countFiltered(status, customerId, search);
    var content = operations.stream().map(OperationResponse::from).toList();
    return PageResponse.of(content, page, size, total);
}
```

**Step 3: Update OperationResource list endpoint**

Replace the existing `list()` method:

```java
@GET
@Transactional
@RolesAllowed({"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"})
public PageResponse<OperationResponse> list(
        @QueryParam("status") OperationStatus status,
        @QueryParam("customerId") Long customerId,
        @QueryParam("search") String search,
        @QueryParam("page") @DefaultValue("0") int page,
        @QueryParam("size") @DefaultValue("10") int size,
        @Context SecurityContext sec) {
    var customerIdFilter = securityHelper.getCustomerIdFilter(sec);
    if (customerIdFilter != null) {
        customerId = customerIdFilter;
    }
    return operationService.listPaginated(status, customerId, search, page, size);
}
```

Add imports:
```java
import com.janus.shared.api.dto.PageResponse;
import jakarta.ws.rs.DefaultValue;
```

**Step 4: Run tests**

Run: `cd janus-backend && ./gradlew test`
Expected: PASS

**Step 5: Commit**

```bash
git add janus-backend/src/main/java/com/janus/operation/
git commit -m "feat: add server-side pagination to operations endpoint"
```

---

### Task 4: Backend — Add server-side pagination to Exchange Rates

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/exchangerate/domain/repository/ExchangeRateRepository.java`
- Modify: `janus-backend/src/main/java/com/janus/exchangerate/application/ExchangeRateService.java`
- Modify: `janus-backend/src/main/java/com/janus/exchangerate/api/ExchangeRateResource.java`

**Step 1: Add paginated method to ExchangeRateRepository**

In `ExchangeRateRepository.java`, add:

```java
import io.quarkus.panache.common.Page;

public List<ExchangeRate> listPaginated(int page, int size) {
    return find("order by effectiveDate desc, createdAt desc")
            .page(Page.of(page, size))
            .list();
}

public long countAll() {
    return count();
}
```

**Step 2: Add paginated method to ExchangeRateService**

In `ExchangeRateService.java`, add:

```java
import com.janus.shared.api.dto.PageResponse;
import com.janus.exchangerate.api.dto.ExchangeRateResponse;

public PageResponse<ExchangeRateResponse> listPaginated(int page, int size) {
    var rates = exchangeRateRepository.listPaginated(page, size);
    var total = exchangeRateRepository.countAll();
    var content = rates.stream().map(ExchangeRateResponse::from).toList();
    return PageResponse.of(content, page, size, total);
}
```

**Step 3: Update ExchangeRateResource list endpoint**

Replace the existing `list()` method:

```java
@GET
@RolesAllowed("ADMIN")
public PageResponse<ExchangeRateResponse> list(
        @QueryParam("page") @DefaultValue("0") int page,
        @QueryParam("size") @DefaultValue("10") int size) {
    return exchangeRateService.listPaginated(page, size);
}
```

Add import:
```java
import com.janus.shared.api.dto.PageResponse;
import jakarta.ws.rs.DefaultValue;
```

**Step 4: Run tests**

Run: `cd janus-backend && ./gradlew test`
Expected: PASS

**Step 5: Commit**

```bash
git add janus-backend/src/main/java/com/janus/exchangerate/
git commit -m "feat: add server-side pagination to exchange rates endpoint"
```

---

### Task 5: Frontend — Create shared PageResponse model and PaginationComponent

**Files:**
- Create: `janus-frontend/src/app/core/models/page.model.ts`
- Create: `janus-frontend/src/app/shared/components/pagination/pagination.component.ts`

**Step 1: Create PageResponse interface**

```typescript
// page.model.ts
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
```

**Step 2: Create PaginationComponent**

```typescript
// pagination.component.ts
import { Component, input, output } from '@angular/core';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [NgbPaginationModule, TranslateModule],
  template: `
    @if (totalPages() > 1) {
      <div class="d-flex justify-content-between align-items-center mt-3 px-3 pb-3">
        <small class="text-body-secondary">
          {{ 'PAGINATION.SHOWING' | translate:{ from: from(), to: to(), total: totalElements() } }}
        </small>
        <ngb-pagination
          [collectionSize]="totalElements()"
          [page]="currentPage()"
          [pageSize]="pageSize()"
          [maxSize]="5"
          [rotate]="true"
          [boundaryLinks]="true"
          (pageChange)="onPageChange($event)"
          size="sm">
        </ngb-pagination>
      </div>
    }
  `
})
export class PaginationComponent {
  currentPage = input.required<number>();
  pageSize = input.required<number>();
  totalElements = input.required<number>();
  totalPages = input.required<number>();
  pageChange = output<number>();

  from(): number {
    return ((this.currentPage() - 1) * this.pageSize()) + 1;
  }

  to(): number {
    return Math.min(this.currentPage() * this.pageSize(), this.totalElements());
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }
}
```

**Note:** `ngb-pagination` is 1-based (page 1 = first page). The backend is 0-based (page 0 = first page). The component will use 1-based internally and each list component will convert when calling the backend: `page - 1`.

**Step 3: Add i18n keys to both en.json and es.json**

In `en.json`, add under root:
```json
"PAGINATION": {
  "SHOWING": "Showing {{from}} to {{to}} of {{total}} results"
}
```

In `es.json`, add under root:
```json
"PAGINATION": {
  "SHOWING": "Mostrando {{from}} a {{to}} de {{total}} resultados"
}
```

**Step 4: Verify build**

Run: `cd janus-frontend && npx ng build`
Expected: BUILD SUCCESS

**Step 5: Commit**

```bash
git add janus-frontend/src/app/core/models/page.model.ts janus-frontend/src/app/shared/components/pagination/ janus-frontend/src/assets/i18n/
git commit -m "feat: add shared pagination component and PageResponse model"
```

---

### Task 6: Frontend — Wire pagination to Customer list (server-side)

**Files:**
- Modify: `janus-frontend/src/app/core/services/customer.service.ts`
- Modify: `janus-frontend/src/app/features/customers/customer-list/customer-list.component.ts`

**Step 1: Update CustomerService.getAll to support pagination**

In `customer.service.ts`, replace `getAll()`:

```typescript
import { HttpParams } from '@angular/common/http';
import { PageResponse } from '../../models/page.model';

getAll(page = 0, size = 10, search?: string): Observable<PageResponse<Customer>> {
  let params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString());
  if (search) params = params.set('search', search);
  return this.http.get<PageResponse<Customer>>(this.apiUrl, { params });
}
```

**Step 2: Update CustomerListComponent to use server-side pagination**

Replace the component logic to:
- Remove `filteredCustomers` computed signal (filtering moves to server)
- Add `currentPage`, `totalElements`, `totalPages` signals
- Add `loadCustomers(page, search)` method that calls the service
- Debounce search input (300ms) to avoid excessive API calls
- Keep `selectedType` filter as a query param to backend OR remove it (check if backend supports type filtering)

Since the backend doesn't currently support filtering by `customerType`, keep the `customerType` filter client-side on the current page only. The search moves server-side.

Updated component class:

```typescript
import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { CustomerService } from '../../../core/services/customer.service';
import { Customer, CustomerType } from '../../../core/models/customer.model';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingIndicatorComponent } from '../../../shared/components/loading-indicator/loading-indicator.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

// In component decorator, add PaginationComponent to imports

// In template, add after the table's closing </div> (card-body) but before the card's closing </div>:
// <app-pagination
//   [currentPage]="currentPage()"
//   [pageSize]="pageSize"
//   [totalElements]="totalElements()"
//   [totalPages]="totalPages()"
//   (pageChange)="onPageChange($event)" />

// Class:
export class CustomerListComponent implements OnInit {
  private customerService = inject(CustomerService);
  private router = inject(Router);
  authService = inject(AuthService);
  loading = signal(true);
  customers = signal<Customer[]>([]);
  searchTerm = signal('');
  selectedType = signal('');
  customerTypes = Object.values(CustomerType);

  // Pagination state
  currentPage = signal(1);
  pageSize = 10;
  totalElements = signal(0);
  totalPages = signal(0);

  // Debounce search
  private searchSubject = new Subject<string>();

  // Client-side type filter on current page
  filteredCustomers = computed(() => {
    const type = this.selectedType();
    if (!type) return this.customers();
    return this.customers().filter(c => c.customerType === type);
  });

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage.set(1);
      this.loadCustomers();
    });
    this.loadCustomers();
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.searchSubject.next(term);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadCustomers();
  }

  private loadCustomers(): void {
    this.loading.set(true);
    const search = this.searchTerm() || undefined;
    this.customerService.getAll(this.currentPage() - 1, this.pageSize, search).subscribe(response => {
      this.customers.set(response.content);
      this.totalElements.set(response.totalElements);
      this.totalPages.set(response.totalPages);
      this.loading.set(false);
    });
  }

  goToDetail(id: number): void {
    this.router.navigate(['/customers', id, 'edit']);
  }
}
```

Update the template search input to use `(ngModelChange)="onSearch($event)"` instead of binding directly to the signal.

**Step 3: Verify build**

Run: `cd janus-frontend && npx ng build`
Expected: BUILD SUCCESS

**Step 4: Commit**

```bash
git add janus-frontend/src/app/core/services/customer.service.ts janus-frontend/src/app/features/customers/
git commit -m "feat: wire server-side pagination to customer list"
```

---

### Task 7: Frontend — Wire pagination to Operation list (server-side)

**Files:**
- Modify: `janus-frontend/src/app/core/services/operation.service.ts`
- Modify: `janus-frontend/src/app/features/operations/operation-list/operation-list.component.ts`

**Step 1: Update OperationService.getAll to support pagination**

In `operation.service.ts`, replace `getAll()`:

```typescript
import { PageResponse } from '../../models/page.model';

getAll(status?: string, customerId?: number, search?: string, page = 0, size = 10): Observable<PageResponse<Operation>> {
  let params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString());
  if (status) params = params.set('status', status);
  if (customerId) params = params.set('customerId', customerId.toString());
  if (search) params = params.set('search', search);
  return this.http.get<PageResponse<Operation>>(this.apiUrl, { params });
}
```

**Step 2: Update OperationListComponent**

Similar to customers:
- Add pagination state signals (`currentPage`, `totalElements`, `totalPages`)
- Add debounced search
- Move search to server-side, keep `transportMode` filter client-side on current page (or add to backend if feasible)
- Add `PaginationComponent` to imports and template
- Handle `activeFilter` (active/overdue) — these are special client-side filters that load all data. When these are active, fetch all operations without pagination (pass a large `size` like 9999), then filter client-side. When no activeFilter, use normal pagination.

Updated `loadOperations()`:

```typescript
loadOperations(): void {
  this.loading.set(true);
  if (this.activeFilter) {
    // Active/overdue filters need all data — no server pagination
    this.operationService.getAll(undefined, undefined, undefined, 0, 9999).subscribe(response => {
      let ops = response.content;
      if (this.activeFilter === 'active') {
        const excluded = new Set(['CLOSED', 'CANCELLED', 'DRAFT']);
        ops = ops.filter(o => !excluded.has(o.status));
      } else if (this.activeFilter === 'overdue') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        ops = ops.filter(o =>
          o.status !== 'CLOSED' && o.status !== 'CANCELLED' &&
          o.arrivalDate != null && new Date(o.arrivalDate) < today
        );
      }
      this.operations.set(ops);
      this.totalElements.set(ops.length);
      this.totalPages.set(Math.ceil(ops.length / this.pageSize));
      this.loading.set(false);
    });
  } else {
    const search = this.searchTerm() || undefined;
    this.operationService.getAll(
      this.filterStatus || undefined,
      undefined,
      search,
      this.currentPage() - 1,
      this.pageSize
    ).subscribe(response => {
      this.operations.set(response.content);
      this.totalElements.set(response.totalElements);
      this.totalPages.set(response.totalPages);
      this.loading.set(false);
    });
  }
}
```

**Step 3: Verify build**

Run: `cd janus-frontend && npx ng build`
Expected: BUILD SUCCESS

**Step 4: Commit**

```bash
git add janus-frontend/src/app/core/services/operation.service.ts janus-frontend/src/app/features/operations/
git commit -m "feat: wire server-side pagination to operation list"
```

---

### Task 8: Frontend — Wire pagination to Exchange Rate list (server-side)

**Files:**
- Modify: `janus-frontend/src/app/core/services/exchange-rate.service.ts`
- Modify: `janus-frontend/src/app/features/exchange-rates/exchange-rate-list/exchange-rate-list.component.ts`

**Step 1: Update ExchangeRateService.getAll**

```typescript
import { HttpParams } from '@angular/common/http';
import { PageResponse } from '../../models/page.model';

getAll(page = 0, size = 10): Observable<PageResponse<ExchangeRate>> {
  let params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString());
  return this.http.get<PageResponse<ExchangeRate>>(this.apiUrl, { params });
}
```

**Step 2: Update ExchangeRateListComponent**

- Add pagination signals and `PaginationComponent`
- Update `loadRates()` to use paginated response
- Add `onPageChange()` method
- Add pagination component in the history card, after the table

**Step 3: Verify build**

Run: `cd janus-frontend && npx ng build`
Expected: BUILD SUCCESS

**Step 4: Commit**

```bash
git add janus-frontend/src/app/core/services/exchange-rate.service.ts janus-frontend/src/app/features/exchange-rates/
git commit -m "feat: wire server-side pagination to exchange rate list"
```

---

### Task 9: Frontend — Add client-side pagination to Port list

**Files:**
- Modify: `janus-frontend/src/app/features/ports/port-list/port-list.component.ts`

**No backend changes.**

**Step 1: Update PortListComponent**

Add pagination state and computed signal for paginated view:

```typescript
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

// Add to imports array in @Component

// Add signals:
currentPage = signal(1);
pageSize = 10;

// Add computed for paginated display:
paginatedPorts = computed(() => {
  const filtered = this.filteredPorts();
  const start = (this.currentPage() - 1) * this.pageSize;
  return filtered.slice(start, start + this.pageSize);
});

totalElements = computed(() => this.filteredPorts().length);
totalPages = computed(() => Math.ceil(this.filteredPorts().length / this.pageSize));

// Add method:
onPageChange(page: number): void {
  this.currentPage.set(page);
}
```

In the template:
- Change `@for (port of filteredPorts()` to `@for (port of paginatedPorts()`
- Add `<app-pagination>` after the table
- When search changes, reset page to 1:
  - Update search binding: `(ngModelChange)="onSearch($event)"`
  - Add `onSearch(term: string) { this.searchTerm.set(term); this.currentPage.set(1); }`

**Step 2: Verify build**

Run: `cd janus-frontend && npx ng build`
Expected: BUILD SUCCESS

**Step 3: Commit**

```bash
git add janus-frontend/src/app/features/ports/
git commit -m "feat: add client-side pagination to port list"
```

---

### Task 10: Frontend — Add client-side pagination to User list

**Files:**
- Modify: `janus-frontend/src/app/features/users/user-list/user-list.component.ts`

**No backend changes.**

**Step 1: Update UserListComponent**

Add pagination state and computed signal:

```typescript
import { computed } from '@angular/core';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

// Add to imports array in @Component

// Add signals:
currentPage = signal(1);
pageSize = 10;

paginatedUsers = computed(() => {
  const all = this.users();
  const start = (this.currentPage() - 1) * this.pageSize;
  return all.slice(start, start + this.pageSize);
});

totalElements = computed(() => this.users().length);
totalPages = computed(() => Math.ceil(this.users().length / this.pageSize));

onPageChange(page: number): void {
  this.currentPage.set(page);
}
```

In template:
- Change `@for (user of users()` to `@for (user of paginatedUsers()`
- Add `<app-pagination>` after the table

**Step 2: Verify build**

Run: `cd janus-frontend && npx ng build`
Expected: BUILD SUCCESS

**Step 3: Commit**

```bash
git add janus-frontend/src/app/features/users/
git commit -m "feat: add client-side pagination to user list"
```

---

### Task 11: Functional Testing — All paginated lists (Playwright)

**Delegate to a sonnet-model sub-agent.** Start both backend (`./gradlew quarkusDev`) and frontend (`ng serve`) before testing.

| Change | Affected Areas | Tests to Run |
|--------|---------------|--------------|
| Customer list pagination | Customer list, customer search | Navigate to /customers, verify pagination controls, search + paginate, type filter |
| Operation list pagination | Operation list, status filter, search | Navigate to /operations, verify pagination, test status filter + pagination, search |
| Exchange rate list pagination | Exchange rate history table | Navigate to /exchange-rates, verify history table paginated |
| Port list pagination | Port list, port search | Navigate to /ports, verify pagination, search + reset page |
| User list pagination | User list | Navigate to /users, verify pagination controls |

**Test Steps per list:**

1. Navigate to the list page
2. Verify data loads and pagination controls are visible (if more than 10 items)
3. Click page 2 — verify data changes
4. Click previous — verify returns to page 1
5. For server-side: type search term — verify results update and page resets to 1
6. For client-side: type search term — verify results filter and page resets to 1
7. Take screenshot for evidence

---

### Task 12: Final commit — Update design doc with completed status

**Step 1: Commit any remaining changes**

```bash
git add -A
git commit -m "feat: complete pagination for all list views"
```
