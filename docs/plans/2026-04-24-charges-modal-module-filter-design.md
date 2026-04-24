# Design: Filter Categories by Module in Add Charge Modal

**Date:** 2026-04-24  
**Status:** Approved

## Problem

The "Agregar Cargo" modal (`ExpenseDetailModalComponent`) displays all active services in the category dropdown regardless of context. The `ServiceConfig` model already has an `appliesTo: ServiceModule[]` field (`LOGISTICS` | `CARGO`), but the modal ignores it and loads everything.

## Goal

When the modal is opened in a logistics context, only show services where `appliesTo` includes `LOGISTICS`. When opened in a cargo context, only show services where `appliesTo` includes `CARGO`.

## Approach: Frontend filtering with `@Input` (no backend changes)

The backend already returns `appliesTo` in every `ServiceResponse`. Filtering client-side is sufficient given the small dataset (~10 services).

## Changes

### 1. `ChargesTableComponent`

Add `@Input() module: ServiceModule = 'LOGISTICS'`.

When opening the modal via `openAddExpense()`, assign the module to the modal instance:
```typescript
modalRef.componentInstance.module = this.module;
```

### 2. `ExpenseDetailModalComponent`

Add `@Input() module: ServiceModule = 'LOGISTICS'`.

In `loadCategories()`, filter after receiving the API response:
```typescript
this.activeCategories.set(
  categories.filter(cat => cat.appliesTo.includes(this.module))
);
```

### 3. Parent components

Each parent that renders `<app-charges-table>` must pass its module explicitly:
- Logistics contexts → `[module]="'LOGISTICS'"`
- Cargo contexts → `[module]="'CARGO'"`

## Out of Scope

- Backend changes (no new query params, no new endpoints)
- Changing which services are assigned to which module (already configured in DB)
- Income vs Expense tab filtering (separate concern)

## Files to Change

| File | Change |
|------|--------|
| `charges-table.component.ts` | Add `@Input() module`, pass to modal |
| `expense-detail-modal.component.ts` | Add `@Input() module`, filter `activeCategories` |
| Parent components using `<app-charges-table>` | Pass `[module]` binding |
