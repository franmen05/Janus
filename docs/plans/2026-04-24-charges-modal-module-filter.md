# Charges Modal Module Filter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Filter the category dropdown in the "Agregar Cargo" modal to only show services whose `appliesTo` array includes the module of the context where the modal is opened (LOGISTICS or CARGO).

**Architecture:** Add a `module` property to `ExpenseDetailModalComponent` (default `'LOGISTICS'`). Move `loadCategories()` call into `initForm()` so it runs after the parent sets `module`. Filter `activeCategories` by `cat.appliesTo.includes(this.module)`. Add a `module` signal input to `ChargesTableComponent` and propagate it to both modal-open methods. Bind `[module]` in all parent templates.

**Tech Stack:** Angular 20, TypeScript, signals (`input()`), `ServiceModule` type from `service.model.ts`

---

### Task 1: Add `module` property and filter to `ExpenseDetailModalComponent`

**Files:**
- Modify: `janus-frontend/src/app/shared/components/charges-table/expense-detail-modal/expense-detail-modal.component.ts`

**Step 1: Add the import for `ServiceModule`**

At the top of the file, the import for `service.model.ts` is:
```typescript
import { ServiceConfig } from '../../../../core/models/service.model';
```
Change it to:
```typescript
import { ServiceConfig, ServiceModule } from '../../../../core/models/service.model';
```

**Step 2: Add the `module` property**

The file has a block of plain class properties (like `operationId`, `expense`, `canEdit`). Add `module` next to them. Look for the section around line 305 where `activeTab`, `activeCategories`, and `categoriesLoading` are declared, and add `module` just above them:
```typescript
module: ServiceModule = 'LOGISTICS';
```

**Step 3: Move `loadCategories()` call from `ngOnInit` to `initForm`**

Currently `ngOnInit` calls `loadCategories()`:
```typescript
ngOnInit(): void {
    this.loadCategories();
}
```

The problem: `ngOnInit` fires before the parent sets `ref.componentInstance.module`, so the filter would always use the default. The fix is to call `loadCategories()` from `initForm()` instead, since `initForm()` is called explicitly by the parent AFTER setting all properties.

Find `ngOnInit` and remove the `loadCategories()` call so it becomes empty:
```typescript
ngOnInit(): void {
}
```

Then find `initForm()` — it's the public method that sets up the reactive form. Add `this.loadCategories();` as the **first line** of `initForm()`:
```typescript
initForm(): void {
    this.loadCategories();
    // ... rest of existing code unchanged
}
```

**Step 4: Add filter in `loadCategories()`**

Find `loadCategories()` (around line 323). Change the `next` callback from:
```typescript
next: categories => {
    this.activeCategories.set(categories);
    this.categoriesLoading.set(false);
},
```
To:
```typescript
next: categories => {
    this.activeCategories.set(
        categories.filter(cat => cat.appliesTo.includes(this.module))
    );
    this.categoriesLoading.set(false);
},
```

**Step 5: Verify build**

```bash
cd janus-frontend && npx ng build 2>&1 | tail -20
```
Expected: Build succeeds with no TypeScript errors.

**Step 6: Commit**

```bash
git add janus-frontend/src/app/shared/components/charges-table/expense-detail-modal/expense-detail-modal.component.ts
git commit -m "feat: filter charge modal categories by service module"
```

---

### Task 2: Add `module` input to `ChargesTableComponent` and propagate to modal

**Files:**
- Modify: `janus-frontend/src/app/shared/components/charges-table/charges-table.component.ts`

**Step 1: Add the import for `ServiceModule`**

At the top of the file, find the import for `service.model.ts` (or add one). The component currently imports from various core modules. Add:
```typescript
import { ServiceModule } from '../../../core/models/service.model';
```

**Step 2: Add `module` signal input**

The component uses the `input()` function from Angular (not `@Input()` decorator). The existing inputs look like:
```typescript
operationId = input.required<number>();
operation = input.required<Operation | null>();
operationSummary = input<...>(null);
accounts = input<Account[]>([]);
liquidationStatus = input<string | null>(null);
```

Add `module` right after the other inputs:
```typescript
module = input<ServiceModule>('LOGISTICS');
```

**Step 3: Pass `module` in `openAddExpense()`**

Find `openAddExpense()` (around line 185). It sets several properties on `ref.componentInstance`. Add the module assignment **before** the `initForm()` call:
```typescript
ref.componentInstance.module = this.module();
```

The full `openAddExpense` after the change:
```typescript
openAddExpense(): void {
    const ref = this.modalService.open(ExpenseDetailModalComponent, { size: 'xl' });
    ref.componentInstance.expense = null;
    ref.componentInstance.operationId = this.operationId();
    ref.componentInstance.canEdit = true;
    ref.componentInstance.accounts = this.accounts();
    ref.componentInstance.operationSummary = this.operationSummary();
    ref.componentInstance.defaultChargeType = this.activeChargeTab();
    ref.componentInstance.module = this.module();   // ← ADD THIS LINE
    ref.componentInstance.initForm();
    ref.closed.subscribe((result) => {
      if (result === 'created' || result === 'created-continue') {
        this.loadExpenses();
        this.changed.emit();
        if (result === 'created-continue') {
          this.openAddExpense();
        }
      }
    });
}
```

**Step 4: Pass `module` in `openExpenseDetail()` too**

Find `openExpenseDetail()` (around line 205). Same pattern — add module before `initForm()`:
```typescript
ref.componentInstance.module = this.module();   // ← ADD THIS LINE
ref.componentInstance.initForm();
```

**Step 5: Verify build**

```bash
cd janus-frontend && npx ng build 2>&1 | tail -20
```
Expected: Build succeeds with no TypeScript errors.

**Step 6: Commit**

```bash
git add janus-frontend/src/app/shared/components/charges-table/charges-table.component.ts
git commit -m "feat: propagate module input to charges modal"
```

---

### Task 3: Bind `[module]` in parent components

Two components use `<app-charges-table>`:
1. `inspection-panel.component.ts` — inspection/logistics context → `LOGISTICS`
2. `payment-panel.component.ts` — payment/liquidation context → `LOGISTICS`

**Files:**
- Modify: `janus-frontend/src/app/features/operations/inspection-panel/inspection-panel.component.ts`
- Modify: `janus-frontend/src/app/features/operations/payment-panel/payment-panel.component.ts`

**Step 1: Update `inspection-panel.component.ts`**

Find the `<app-charges-table>` tag (around line 24). It currently looks like:
```html
<app-charges-table class="mb-3 d-block"
  [operationId]="operationId()"
  [operation]="operation()"
  [operationSummary]="operationSummary()"
  [accounts]="accounts()"
  (changed)="onChargesChanged()" />
```

Add `[module]="'LOGISTICS'"`:
```html
<app-charges-table class="mb-3 d-block"
  [operationId]="operationId()"
  [operation]="operation()"
  [operationSummary]="operationSummary()"
  [accounts]="accounts()"
  [module]="'LOGISTICS'"
  (changed)="onChargesChanged()" />
```

**Step 2: Update `payment-panel.component.ts`**

Find the `<app-charges-table>` tag (around line 26). Add `[module]="'LOGISTICS'"`:
```html
<app-charges-table class="mb-3 d-block"
  [operationId]="operationId()"
  [operation]="operation()"
  [operationSummary]="operationSummary()"
  [accounts]="accounts()"
  [liquidationStatus]="liquidation()?.status ?? null"
  [module]="'LOGISTICS'"
  (changed)="onChargesChanged()" />
```

**Step 3: Verify build**

```bash
cd janus-frontend && npx ng build 2>&1 | tail -20
```
Expected: Build succeeds with no TypeScript errors.

**Step 4: Commit**

```bash
git add janus-frontend/src/app/features/operations/inspection-panel/inspection-panel.component.ts
git add janus-frontend/src/app/features/operations/payment-panel/payment-panel.component.ts
git commit -m "feat: pass LOGISTICS module to charges table in operation panels"
```

---

### Task 4: Functional Testing (Playwright)

**Preconditions:**
- Backend running at `http://localhost:8080`
- Frontend running at `http://localhost:4200`
- At least one operation exists in the system
- At least one service is configured with `appliesTo = {LOGISTICS}` only (not CARGO)

**Test Plan:**

| Change | Affected Area | Test Steps |
|--------|--------------|------------|
| Category filter by module | Agregar Cargo modal category select | Open modal, verify only LOGISTICS services appear |
| Default module | ChargesTableComponent | Without explicit module, category list still loads correctly |
| Regression | Existing charges visible | Existing charges in the table still display correctly |

**Steps:**
1. Navigate to an operation that has the inspection/charges panel visible
2. Click "Agregar Cargo" button
3. Open the category select dropdown
4. Verify: only services with `appliesTo` containing `LOGISTICS` are listed
5. Verify: no CARGO-only services appear
6. Verify: services that apply to both LOGISTICS and CARGO still appear
7. Take screenshot of the open dropdown for evidence
8. Submit the form with a valid category — verify charge is saved
9. Verify: existing charges in the table still render correctly (regression check)
