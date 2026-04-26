# Account Activate/Deactivate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-04-25-account-activate-deactivate-design.md`

**Goal:** Enable ADMIN users to activate/deactivate accounts from the list, hide inactive accounts from the list by default and from operation creation selectors.

**Architecture:** Backend exposes a new `PATCH /api/accounts/{id}/active` endpoint guarded by `@RolesAllowed("ADMIN")`. The list endpoint accepts a new `activeOnly` query param. Frontend adds row-level Activate/Deactivate buttons (with confirmation modal for deactivate), a "Show inactive" toggle, and updates operation-related selectors to request only active accounts.

**Tech Stack:** Quarkus 3.27.2 / Java 21 (backend), Angular 20 + Bootstrap 5 + ng-bootstrap (frontend), `@RolesAllowed` for RBAC, Panache for persistence, ngx-translate for i18n.

**Orchestration model:** Per `CLAUDE.md`, the main context delegates to agents. Each task below is a self-contained agent dispatch with concrete code and verification steps.

---

## File Map

### Backend (`janus-backend`)

| File | Action | Purpose |
|---|---|---|
| `src/main/java/com/janus/account/api/dto/SetAccountActiveRequest.java` | Create | Request body record `{ boolean active }` |
| `src/main/java/com/janus/account/api/AccountResource.java` | Modify | Add `PATCH /{id}/active`, add `activeOnly` query param to `list` |
| `src/main/java/com/janus/account/application/AccountService.java` | Modify | Add `setActive(id, active, username)`; pass `activeOnly` through `listPaginated` |
| `src/main/java/com/janus/account/domain/repository/AccountRepository.java` | Modify | `findPaginated(search, page, size, activeOnly)` and `countFiltered(search, activeOnly)` |
| `src/test/java/com/janus/account/AccountResourceTest.java` | Create | Endpoint tests: PATCH activate/deactivate, 404, RBAC, list with `activeOnly` |

### Frontend (`janus-frontend`)

| File | Action | Purpose |
|---|---|---|
| `src/app/core/services/account.service.ts` | Modify | Add `setActive(id, active)`; add `activeOnly` to `getAll` |
| `src/app/features/accounts/account-list/account-list.component.ts` | Modify | Activate/Deactivate buttons + confirm modal + `Show inactive` toggle |
| `src/app/features/operations/operation-form/operation-form.component.ts` | Modify | Pass `activeOnly=true` to `accountService.getAll(...)` (lines 391, 456) |
| `src/app/features/operations/payment-panel/payment-panel.component.ts` | Modify | Pass `activeOnly=true` (line 467) |
| `src/app/features/operations/inspection-panel/inspection-panel.component.ts` | Modify | Pass `activeOnly=true` (line 157) |
| `src/assets/i18n/en.json` | Modify | New i18n keys (English) |
| `src/assets/i18n/es.json` | Modify | New i18n keys (Spanish) |

---

## API Contract (locked)

```
PATCH /api/accounts/{id}/active
Path Params: id (Long)
Request Body: { "active": boolean }
Response Body: AccountResponse (existing record)
Error Response: 404 { error: "...", errorCode: "NOT_FOUND" }
Auth: @RolesAllowed("ADMIN")
Status Codes: 200 OK, 400 Bad Request (missing body), 403 Forbidden, 404 Not Found

GET /api/accounts?page=0&size=10&search=&activeOnly=true|false
- activeOnly: optional Boolean, default false (no filter); when true, only active accounts
```

---

## Task 1: Backend — endpoint, repository, service, tests

**Owner:** Backend Agent (general-purpose)

**Files (see File Map above)**

- [ ] **Step 1: Dispatch Backend Agent with the prompt below**

```
You are working on janus-backend (Quarkus 3.27.2, Java 21, Gradle).
Package: com.janus. DTOs are Java records. Use Jakarta EE APIs (jakarta.*).
Conventions: see .claude/rules/backend.md

Task: Implement Account activate/deactivate per the spec at
docs/superpowers/specs/2026-04-25-account-activate-deactivate-design.md.

Make the following changes exactly:

1) Create file: src/main/java/com/janus/account/api/dto/SetAccountActiveRequest.java

    package com.janus.account.api.dto;

    public record SetAccountActiveRequest(boolean active) {}

2) Modify src/main/java/com/janus/account/domain/repository/AccountRepository.java

   Update findPaginated and countFiltered to accept `Boolean activeOnly`
   (when null or false → no extra filter; when true → AND active = true).

   Replace the existing findPaginated and countFiltered methods with:

    public List<Account> findPaginated(String search, int page, int size, Boolean activeOnly) {
        boolean filterActive = Boolean.TRUE.equals(activeOnly);
        if (search != null && !search.isBlank()) {
            var pattern = "%" + search.toLowerCase() + "%";
            if (filterActive) {
                return find("(LOWER(name) LIKE ?1 OR LOWER(taxId) LIKE ?1 OR LOWER(accountCode) LIKE ?1) AND active = true", pattern)
                        .page(Page.of(page, size))
                        .list();
            }
            return find("LOWER(name) LIKE ?1 OR LOWER(taxId) LIKE ?1 OR LOWER(accountCode) LIKE ?1", pattern)
                    .page(Page.of(page, size))
                    .list();
        }
        if (filterActive) {
            return find("active = true").page(Page.of(page, size)).list();
        }
        return findAll().page(Page.of(page, size)).list();
    }

    public long countFiltered(String search, Boolean activeOnly) {
        boolean filterActive = Boolean.TRUE.equals(activeOnly);
        if (search != null && !search.isBlank()) {
            var pattern = "%" + search.toLowerCase() + "%";
            if (filterActive) {
                return count("(LOWER(name) LIKE ?1 OR LOWER(taxId) LIKE ?1 OR LOWER(accountCode) LIKE ?1) AND active = true", pattern);
            }
            return count("LOWER(name) LIKE ?1 OR LOWER(taxId) LIKE ?1 OR LOWER(accountCode) LIKE ?1", pattern);
        }
        if (filterActive) {
            return count("active = true");
        }
        return count();
    }

3) Modify src/main/java/com/janus/account/application/AccountService.java

   Update listPaginated signature and add setActive method.

   Replace listPaginated with:

    @Transactional
    public PageResponse<AccountResponse> listPaginated(String search, int page, int size, Boolean activeOnly) {
        var accounts = accountRepository.findPaginated(search, page, size, activeOnly);
        accounts.forEach(a -> {
            a.contacts.size();
            a.associatedAccounts.size();
        });
        var total = accountRepository.countFiltered(search, activeOnly);
        var content = accounts.stream().map(AccountResponse::from).toList();
        return PageResponse.of(content, page, size, total);
    }

   Add new method (place after `update`):

    @Transactional
    public Account setActive(Long id, boolean active, String username) {
        var account = findById(id);
        if (account.active == active) {
            return account;
        }
        account.active = active;
        var verb = active ? "activated" : "deactivated";
        auditEvent.fire(new AuditEvent(username, AuditAction.UPDATE, "Account", account.id, null, null, null,
                "Account " + verb + ": " + account.name));
        return account;
    }

4) Modify src/main/java/com/janus/account/api/AccountResource.java

   a) Add @PATCH import: jakarta.ws.rs.PATCH
   b) Add QueryParam activeOnly (Boolean) to list method and pass through:

    @GET
    public PageResponse<AccountResponse> list(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("10") int size,
            @QueryParam("search") String search,
            @QueryParam("activeOnly") Boolean activeOnly) {
        return accountService.listPaginated(search, page, size, activeOnly);
    }

   c) Add new endpoint (after update, before addPartner):

    @PATCH
    @Path("/{id}/active")
    @RolesAllowed("ADMIN")
    public AccountResponse setActive(@PathParam("id") Long id, @Valid SetAccountActiveRequest request, @Context SecurityContext sec) {
        return AccountResponse.from(accountService.setActive(id, request.active(), sec.getUserPrincipal().getName()));
    }

   Add the import: import com.janus.account.api.dto.SetAccountActiveRequest;

5) Create file: src/test/java/com/janus/account/AccountResourceTest.java

   Use @QuarkusTest + RestAssured. Use the existing test seed data (or create
   a minimal account in @BeforeEach). Mirror the patterns from AccountCsvServiceTest.

   Required tests:
   - testSetActive_AsAdmin_Success: PATCH /api/accounts/{id}/active with {active:false}
     returns 200 and the response has active=false. Then PATCH with {active:true}
     returns active=true.
   - testSetActive_NotFound: PATCH /api/accounts/999999/active returns 404.
   - testSetActive_Forbidden_AsAgent: With AGENT role, PATCH returns 403.
   - testList_ActiveOnly_FiltersInactive: After deactivating an account,
     GET /api/accounts?activeOnly=true does NOT include it; without the flag, it does.

   Use @TestSecurity(user="admin", roles={"ADMIN"}) and roles={"AGENT"} as needed.

After implementation, run: cd janus-backend && ./gradlew test
Report: files changed, test results (each new test pass/fail), any compilation issues.
```

- [ ] **Step 2: Verify backend success**

Run: `cd janus-backend && ./gradlew test`
Expected: All tests pass, including 4 new tests in `AccountResourceTest`.

- [ ] **Step 3: Commit backend changes**

```bash
git add janus-backend/src/main/java/com/janus/account janus-backend/src/test/java/com/janus/account/AccountResourceTest.java
git commit -m "feat(account): add PATCH /api/accounts/{id}/active and activeOnly filter"
```

---

## Task 2: Frontend — service + list UI + i18n

**Owner:** Frontend Agent (general-purpose)

**Files:**
- Modify: `src/app/core/services/account.service.ts`
- Modify: `src/app/features/accounts/account-list/account-list.component.ts`
- Modify: `src/assets/i18n/en.json`
- Modify: `src/assets/i18n/es.json`

- [ ] **Step 1: Dispatch Frontend Agent with the prompt below**

```
You are working on janus-frontend (Angular 20, Bootstrap 5, TypeScript).
Standalone components, signals, inject(). Patterns in src/app/features/ and src/app/core/.
i18n in src/assets/i18n/ (both en.json and es.json).
Conventions: see .claude/rules/frontend.md

Task: Add Activate/Deactivate UI to the account list per spec
docs/superpowers/specs/2026-04-25-account-activate-deactivate-design.md.

API contract:
- PATCH /api/accounts/{id}/active  body: { active: boolean }  → returns Account
- GET /api/accounts?activeOnly=true  → only active accounts

Make the following changes exactly:

1) Modify src/app/core/services/account.service.ts

   a) Update getAll signature:

      getAll(page = 0, size = 10, search?: string, activeOnly?: boolean): Observable<PageResponse<Account>> {
        let params = new HttpParams()
          .set('page', page.toString())
          .set('size', size.toString());
        if (search) params = params.set('search', search);
        if (activeOnly) params = params.set('activeOnly', 'true');
        return this.http.get<PageResponse<Account>>(this.apiUrl, { params });
      }

   b) Add setActive method (place after update):

      setActive(id: number, active: boolean): Observable<Account> {
        return this.http.patch<Account>(`${this.apiUrl}/${id}/active`, { active });
      }

2) Modify src/app/features/accounts/account-list/account-list.component.ts

   a) Add imports:

      import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
      import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
      import { ToastService } from '../../../core/services/toast.service';
      import { TranslateService } from '@ngx-translate/core';

   b) Add to component class (top of class):

      private modalService = inject(NgbModal);
      private toast = inject(ToastService);
      private translate = inject(TranslateService);
      showInactive = signal(false);

   c) Change loadAccounts to pass activeOnly:

      private loadAccounts(): void {
        this.loading.set(true);
        const search = this.searchTerm() || undefined;
        const activeOnly = !this.showInactive();
        this.accountService.getAll(this.currentPage() - 1, this.pageSize, search, activeOnly).subscribe({
          next: response => {
            this.accounts.set(response.content);
            this.totalElements.set(response.totalElements);
            this.totalPages.set(response.totalPages);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
      }

   d) Add new methods:

      onToggleShowInactive(value: boolean): void {
        this.showInactive.set(value);
        this.currentPage.set(1);
        this.loadAccounts();
      }

      onActivate(account: Account, event: Event): void {
        event.stopPropagation();
        this.accountService.setActive(account.id, true).subscribe({
          next: updated => {
            this.accounts.update(list => list.map(a => a.id === updated.id ? updated : a));
            this.toast.success(this.translate.instant('ACCOUNTS.ACTIVATED_SUCCESS'));
          }
        });
      }

      onDeactivate(account: Account, event: Event): void {
        event.stopPropagation();
        const ref = this.modalService.open(ConfirmDialogComponent);
        // ConfirmDialogComponent uses Angular signal input(); use ComponentRef.setInput.
        ref.componentRef!.setInput('title', this.translate.instant('ACCOUNTS.CONFIRM_DEACTIVATE_TITLE'));
        ref.componentRef!.setInput('message', this.translate.instant('ACCOUNTS.CONFIRM_DEACTIVATE_MESSAGE', { name: account.name }));
        ref.result.then(
          confirmed => {
            if (!confirmed) return;
            this.accountService.setActive(account.id, false).subscribe({
              next: updated => {
                if (!this.showInactive()) {
                  this.accounts.update(list => list.filter(a => a.id !== updated.id));
                } else {
                  this.accounts.update(list => list.map(a => a.id === updated.id ? updated : a));
                }
                this.toast.success(this.translate.instant('ACCOUNTS.DEACTIVATED_SUCCESS'));
              }
            });
          },
          () => { /* dismissed */ }
        );
      }

   e) In the template, add the "Show inactive" checkbox in the card header
      next to the type filter (inside the existing row.g-2 grid, add a third
      column or place above the grid):

      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" id="showInactiveToggle"
               [checked]="showInactive()"
               (change)="onToggleShowInactive($any($event.target).checked)">
        <label class="form-check-label" for="showInactiveToggle">
          {{ 'ACCOUNTS.SHOW_INACTIVE' | translate }}
        </label>
      </div>

   f) In the actions column (inside the existing
      `<div class="d-flex flex-column flex-md-row gap-1">` block), add after the
      "OPERATIONS" link, only for ADMIN:

      @if (authService.hasRole(['ADMIN'])) {
        @if (account.active) {
          <button type="button" class="btn btn-sm btn-outline-danger"
                  (click)="onDeactivate(account, $event)">
            {{ 'ACCOUNTS.DEACTIVATE' | translate }}
          </button>
        } @else {
          <button type="button" class="btn btn-sm btn-outline-success"
                  (click)="onActivate(account, $event)">
            {{ 'ACCOUNTS.ACTIVATE' | translate }}
          </button>
        }
      }

3) Modify src/assets/i18n/en.json — add inside the existing ACCOUNTS object:

   "DEACTIVATE": "Deactivate",
   "ACTIVATE": "Activate",
   "SHOW_INACTIVE": "Show inactive",
   "CONFIRM_DEACTIVATE_TITLE": "Deactivate account",
   "CONFIRM_DEACTIVATE_MESSAGE": "Are you sure you want to deactivate {{name}}?",
   "DEACTIVATED_SUCCESS": "Account deactivated",
   "ACTIVATED_SUCCESS": "Account activated"

4) Modify src/assets/i18n/es.json — add inside the existing ACCOUNTS object:

   "DEACTIVATE": "Inactivar",
   "ACTIVATE": "Activar",
   "SHOW_INACTIVE": "Mostrar inactivas",
   "CONFIRM_DEACTIVATE_TITLE": "Inactivar cuenta",
   "CONFIRM_DEACTIVATE_MESSAGE": "¿Seguro que deseas inactivar {{name}}?",
   "DEACTIVATED_SUCCESS": "Cuenta inactivada",
   "ACTIVATED_SUCCESS": "Cuenta activada"

After implementation, verify: cd janus-frontend && npx ng build
Report: files changed, build status, any TypeScript or template errors.
```

- [ ] **Step 2: Verify frontend builds**

Run: `cd janus-frontend && npx ng build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit frontend list changes**

```bash
git add janus-frontend/src/app/core/services/account.service.ts janus-frontend/src/app/features/accounts/account-list janus-frontend/src/assets/i18n
git commit -m "feat(account): add activate/deactivate buttons and show-inactive filter"
```

---

## Task 3: Frontend — filter operation selectors

**Owner:** Frontend Agent (general-purpose)

**Files:**
- Modify: `src/app/features/operations/operation-form/operation-form.component.ts:391`
- Modify: `src/app/features/operations/operation-form/operation-form.component.ts:456`
- Modify: `src/app/features/operations/payment-panel/payment-panel.component.ts:467`
- Modify: `src/app/features/operations/inspection-panel/inspection-panel.component.ts:157`

- [ ] **Step 1: Dispatch Frontend Agent with the prompt below**

```
You are working on janus-frontend (Angular 20, Bootstrap 5, TypeScript).
Conventions: see .claude/rules/frontend.md

Task: Make operation-related account selectors fetch only active accounts.
Background: AccountService.getAll now accepts a 4th param `activeOnly?: boolean`.

Make these exact changes:

1) src/app/features/operations/operation-form/operation-form.component.ts
   - Line 391 (inside forkJoin / accountsPage): change
       this.accountService.getAll(0, 9999)
     to
       this.accountService.getAll(0, 9999, undefined, true)
   - Line 456 (the second call): same change
       this.accountService.getAll(0, 9999, undefined, true)

2) src/app/features/operations/payment-panel/payment-panel.component.ts
   - Line 467: change
       this.accountService.getAll(0, 9999)
     to
       this.accountService.getAll(0, 9999, undefined, true)

3) src/app/features/operations/inspection-panel/inspection-panel.component.ts
   - Line 157: change
       this.accountService.getAll(0, 9999)
     to
       this.accountService.getAll(0, 9999, undefined, true)

Do NOT touch any other call sites of AccountService.getAll (the account-list
page must keep using its own activeOnly logic driven by the toggle).

After implementation, verify: cd janus-frontend && npx ng build
Report: files changed, build status.
```

- [ ] **Step 2: Verify build**

Run: `cd janus-frontend && npx ng build`
Expected: Build succeeds.

- [ ] **Step 3: Commit selector changes**

```bash
git add janus-frontend/src/app/features/operations
git commit -m "feat(operations): hide inactive accounts from operation selectors"
```

---

## Task 4: Functional testing (Playwright)

**Owner:** Functional Testing Agent (general-purpose, model: sonnet)

**Pre-condition:** Backend running at `http://localhost:8080`, frontend at `http://localhost:4200`. If not running, start them first:

- Backend: `cd janus-backend && ./gradlew quarkusDev` (background)
- Frontend: `cd janus-frontend && ng serve` (background)

- [ ] **Step 1: Dispatch Functional Testing Agent with the prompt below**

```
You are a functional testing agent for the Janus project.
You test features using Playwright MCP browser tools against http://localhost:4200.

Available tools: browser_navigate, browser_click, browser_fill_form, browser_select_option,
browser_snapshot, browser_take_screenshot, browser_press_key, browser_hover, browser_close.

## Screenshots
All screenshots MUST be saved to the `screenshots/` folder at the project root.
Use names like screenshots/account-deactivate-{step}-{description}.png.

## Browser Recovery Protocol
If the browser becomes unresponsive:
1. browser_close
2. browser_navigate to reopen
3. Retry the failed step from the beginning of that flow

Task: Verify account activate/deactivate per the spec at
docs/superpowers/specs/2026-04-25-account-activate-deactivate-design.md.

Test plan (run all):

A) Login as ADMIN
   - Navigate to http://localhost:4200, log in with the seeded ADMIN user
     (use the credentials documented in the project's import.sql / DataSeeder
     — typically admin/admin or similar; check janus-backend src for the
     correct seeded credentials).

B) Deactivate flow
   1. Navigate to /accounts.
   2. Pick an active account (note its name). Click "Inactivar".
   3. Confirm the modal appears with the account name. Take screenshot.
   4. Click "Confirm". Verify success toast and that the account is removed
      from the visible list (because "Mostrar inactivas" toggle is OFF).
   5. Take screenshot of the list after deactivation.

C) Show inactive toggle
   1. Toggle "Mostrar inactivas" ON.
   2. Verify the previously deactivated account appears with badge "Inactive"
      and shows an "Activar" (green) button.
   3. Take screenshot.

D) Activate flow
   1. With toggle ON, click "Activar" on the inactive account.
   2. Verify NO modal appears (direct action).
   3. Verify success toast, badge becomes "Active", button changes to "Inactivar".
   4. Take screenshot.

E) Selector regression — operation creation
   1. Deactivate any account (repeat B1–B4 with a different account, e.g.
      one tagged as CUSTOMER or COMPANY so it would normally appear in
      the operation form).
   2. Navigate to /operations/new.
   3. Open the customer/account dropdown. Verify the deactivated account
      does NOT appear.
   4. Take screenshot of the dropdown.
   5. Cancel and re-activate the account from /accounts (cleanup).

F) Permission regression
   1. Log out, log in as an AGENT user.
   2. Navigate to /accounts.
   3. Verify NO "Inactivar" / "Activar" buttons are rendered for any row.
   4. Take screenshot.

G) Spanish/English i18n
   1. Toggle UI language to Spanish (if a switch exists). Verify labels:
      "Inactivar", "Activar", "Mostrar inactivas".
   2. Take screenshot.
   3. Toggle back to English. Verify "Deactivate", "Activate", "Show inactive".
   4. Take screenshot.

Report:
- Pass/fail for each section A–G
- List of screenshots taken
- Any unexpected behavior, layout breakage, or console errors
```

- [ ] **Step 2: Review the agent's report**

If any test failed: open issues with the implementing agent (Backend or
Frontend) for fixes; loop back to the relevant Task. Otherwise proceed.

- [ ] **Step 3: Final commit (if functional tests revealed nothing to fix)**

No additional commit needed; tests are evidence only.

---

## Wrap-up

- [ ] All tasks complete
- [ ] Backend tests green
- [ ] Frontend build green
- [ ] Functional tests pass
- [ ] Suggest creating PR if user requests
