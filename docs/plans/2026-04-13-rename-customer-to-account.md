# Rename Customer to Account — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rename the `Customer` entity to `Account` across the entire Janus codebase (backend, frontend, database, tests, i18n).

**Architecture:** This is a pure rename/refactor — no behavioral changes. The database is recreated from scratch (drop + recreate), so V1 is rewritten with `accounts` table names from the start, V2 inserts into `accounts`, and V3 is deleted. Backend Java files move from `com.janus.customer` to `com.janus.account` with all class/field renames. Frontend renames models, services, components, routes, and i18n keys.

**Tech Stack:** Quarkus 3.27.2 (Java 21), Angular 20 (TypeScript), Flyway SQL migrations, Bootstrap 5

---

## Task 1: Rewrite Database Migrations

The database will be dropped and recreated, so we modify the existing migrations directly instead of adding a new one.

**Files:**
- Modify: `janus-backend/src/main/resources/db/migration/V1__initial_schema.sql`
- Modify: `janus-backend/src/main/resources/db/migration/V2__insert_mcx_customers.sql`
- Delete: `janus-backend/src/main/resources/db/migration/V3__customer_multi_type.sql`

**Step 1: Update V1 — rename all customer tables/columns to account**

In `V1__initial_schema.sql`, apply these replacements:
- Sequence: `customer_contacts_SEQ` → `account_contacts_SEQ`
- Sequence: `customers_SEQ` → `accounts_SEQ`
- Table: `customers` → `accounts`
- Table: `customer_contacts` → `account_contacts`
- Column: `customer_id` → `account_id` (in users, account_contacts, operations tables)
- Column: `customerCode` → `accountCode`
- Remove the old single `customerType` column — instead, add the `account_types` join table directly in V1 (incorporate V3's multi-type schema)
- Constraint: `FK_customer_contacts_customer_id` → `FK_account_contacts_account_id`
- Constraint: `FK_operations_customer_id` → `FK_operations_account_id`

Add to V1 (from V3, adapted):
```sql
CREATE TABLE account_types (
    account_id BIGINT NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    PRIMARY KEY (account_id, account_type),
    CONSTRAINT FK_account_types_account_id FOREIGN KEY (account_id) REFERENCES accounts(id)
);
```

**Step 2: Update V2 — rename insert targets**

In `V2__insert_mcx_customers.sql`:
- `INSERT INTO customers` → `INSERT INTO accounts`
- Update sequence references: `customers_SEQ` → `accounts_SEQ`
- Update comments to reference "accounts"
- If V2 inserts into `customer_types`, update to `account_types` with `account_id` and `account_type` columns

**Step 3: Delete V3**

Delete `V3__customer_multi_type.sql` entirely — its logic is now baked into V1.

**Step 4: Drop and recreate the database**

Since we use H2 in dev mode, either delete the H2 file or set `quarkus.hibernate-orm.database.generation=drop-and-create` temporarily, then revert. Or simply clean the Flyway state.

**Step 5: Commit**

```
refactor: rewrite migrations with Account naming (drop+recreate DB)
```

---

## Task 2: Backend Domain Models — Rename Package and Entity Classes

This is the core rename. Move all files from `com.janus.customer` to `com.janus.account` and rename all Customer classes to Account.

**Files to move/rename (delete old, create new):**

Domain models:
- `com.janus.customer.domain.model.Customer` → `com.janus.account.domain.model.Account`
- `com.janus.customer.domain.model.CustomerType` → `com.janus.account.domain.model.AccountType`
- `com.janus.customer.domain.model.CustomerContact` → `com.janus.account.domain.model.AccountContact`
- `com.janus.customer.domain.model.ContactType` → `com.janus.account.domain.model.ContactType` (same name, new package)
- `com.janus.customer.domain.model.DocumentType` → `com.janus.account.domain.model.DocumentType` (same name, new package)

Repositories:
- `com.janus.customer.domain.repository.CustomerRepository` → `com.janus.account.domain.repository.AccountRepository`
- `com.janus.customer.domain.repository.CustomerContactRepository` → `com.janus.account.domain.repository.AccountContactRepository`

DTOs:
- `com.janus.customer.api.dto.CreateCustomerRequest` → `com.janus.account.api.dto.CreateAccountRequest`
- `com.janus.customer.api.dto.CustomerResponse` → `com.janus.account.api.dto.AccountResponse`
- `com.janus.customer.api.dto.CreateCustomerContactRequest` → `com.janus.account.api.dto.CreateAccountContactRequest`
- `com.janus.customer.api.dto.CustomerContactResponse` → `com.janus.account.api.dto.AccountContactResponse`

Services:
- `com.janus.customer.application.CustomerService` → `com.janus.account.application.AccountService`
- `com.janus.customer.application.CustomerContactService` → `com.janus.account.application.AccountContactService`

Resources:
- `com.janus.customer.api.CustomerResource` → `com.janus.account.api.AccountResource`
- `com.janus.customer.api.CustomerContactResource` → `com.janus.account.api.AccountContactResource`

**Step 1: Create the new `com.janus.account` package structure**

Create these directories:
- `janus-backend/src/main/java/com/janus/account/domain/model/`
- `janus-backend/src/main/java/com/janus/account/domain/repository/`
- `janus-backend/src/main/java/com/janus/account/api/dto/`
- `janus-backend/src/main/java/com/janus/account/application/`

**Step 2: Create Account.java** (renamed from Customer.java)

Read the current `Customer.java` and create `Account.java` with these changes:
- Package: `com.janus.account.domain.model`
- Class name: `Account`
- `@Table(name = "accounts")`
- `@CollectionTable(name = "account_types", joinColumns = @JoinColumn(name = "account_id"))`
- `@Column(name = "account_type")`
- Field type: `Set<AccountType> accountTypes` (was `customerTypes`)
- Field name: `accountCode` (was `customerCode`)
- Contacts field: `List<AccountContact> contacts`

**Step 3: Create AccountType.java** (renamed from CustomerType.java)

- Package: `com.janus.account.domain.model`
- Enum name: `AccountType`
- Same values: COMPANY, CONSIGNEE, INDIVIDUAL, SHIPPER, CARRIER

**Step 4: Create AccountContact.java** (renamed from CustomerContact.java)

- Package: `com.janus.account.domain.model`
- Class name: `AccountContact`
- `@Table(name = "account_contacts")`
- Field: `public Account account` (was `Customer customer`)

**Step 5: Move ContactType.java and DocumentType.java**

- Same class names, just new package `com.janus.account.domain.model`

**Step 6: Create AccountRepository.java** (renamed from CustomerRepository.java)

- Package: `com.janus.account.domain.repository`
- Class name: `AccountRepository extends PanacheRepository<Account>`
- Same methods, updated field references (`accountCode` instead of `customerCode`)

**Step 7: Create AccountContactRepository.java**

- Package: `com.janus.account.domain.repository`
- Class name: `AccountContactRepository extends PanacheRepository<AccountContact>`
- Methods: `findByAccountId`, `findPrimaryByAccountId` (was `findByCustomerId`, `findPrimaryByCustomerId`)
- Query: `account.id` (was `customer.id`)

**Step 8: Create all DTOs**

- `CreateAccountRequest` — field `accountTypes` (was `customerTypes`), field `accountCode` (was `customerCode`)
- `AccountResponse` — field `accountTypes`, `accountCode`, method `from(Account account)`
- `CreateAccountContactRequest` — same fields, new package
- `AccountContactResponse` — method `from(AccountContact contact)`

**Step 9: Create AccountService.java**

- Uses `AccountRepository`, `CreateAccountRequest`, `AccountResponse`, `Account`
- Audit messages: "Account created: %s", "Account updated: %s"
- Field mappings: `account.accountTypes`, `account.accountCode`

**Step 10: Create AccountContactService.java**

- Uses `AccountContactRepository`, `AccountRepository`
- Parameter names: `accountId` (was `customerId`)

**Step 11: Create AccountResource.java**

- `@Path("/api/accounts")`
- Injects `AccountService`
- All methods use `AccountResponse`, `CreateAccountRequest`

**Step 12: Create AccountContactResource.java**

- `@Path("/api/accounts/{accountId}/contacts")`
- Injects `AccountContactService`
- Path param: `accountId` (was `customerId`)

**Step 13: Delete all old `com.janus.customer` files**

Delete the entire directory: `janus-backend/src/main/java/com/janus/customer/`

**Step 14: Commit**

```
refactor: rename Customer to Account in backend domain, services, and API
```

---

## Task 3: Backend Cross-References — Update All Files That Import Customer

**Files to modify:**

1. **`Operation.java`** (`com.janus.operation.domain.model`)
   - Change import from `com.janus.customer.domain.model.Customer` → `com.janus.account.domain.model.Account`
   - Rename field: `public Account account` (was `Customer customer`)

2. **`User.java`** (`com.janus.user.domain.model`)
   - Rename column: `@Column(name = "account_id")` (was `customer_id`)
   - Rename field: `public Long accountId` (was `customerId`)

3. **`OperationService.java`** (`com.janus.operation.application`)
   - Update import: `AccountRepository` (was `CustomerRepository`)
   - Rename field: `accountRepository` (was `customerRepository`)
   - Rename params: `accountId` (was `customerId`)
   - Update field access: `operation.account` (was `operation.customer`)

4. **`OperationRepository.java`** (`com.janus.operation.domain.repository`)
   - Rename method: `findByAccountId` (was `findByCustomerId`)
   - Update queries: `account.id` (was `customer.id`), `account.name` (was `customer.name`)
   - Rename params: `accountId` (was `customerId`)

5. **`OperationResource.java`** (`com.janus.operation.api`)
   - Rename query param: `@QueryParam("accountId") Long accountId` (was `customerId`)
   - Rename variable: `accountIdFilter` (was `customerIdFilter`)

6. **`CreateOperationRequest.java`** (`com.janus.operation.api.dto`)
   - Rename field: `Long accountId` (was `customerId`)

7. **`OperationResponse.java`** (`com.janus.operation.api.dto`)
   - Rename fields: `Long accountId`, `String accountName` (was `customerId`, `customerName`)
   - Update mapping: `op.account.id`, `op.account.name`

8. **`BillingService.java`** (`com.janus.billing.application`)
   - Update import: `Account` (was `Customer`)
   - Rename param: `Account account` (was `Customer customer`)
   - Update field access: `account.taxId`, `account.email`, etc.

9. **`DeclarationService.java`** (`com.janus.declaration.application`)
   - Update field access: `operation.account.email` (was `operation.customer.email`)
   - Update comments: "Notify account" (was "Notify customer")

10. **`InspectionService.java`** (`com.janus.inspection.application`)
    - Update field access: `operation.account.email`, `operation.account`

11. **`AlertCheckerScheduler.java`** (`com.janus.alert.application`)
    - Update field access: `op.account.email` (was `op.customer.email`)

12. **`ValuationService.java`** (`com.janus.valuation.application`)
    - Update field access: `operation.account.name` (was `operation.customer.name`)

13. **`DataSeeder.java`** (`com.janus.shared.infrastructure`)
    - Update imports: `Account`, `AccountType`, `AccountRepository`
    - Update variable names and type references

14. **`SecurityHelper.java`** (`com.janus.shared.infrastructure.security`)
    - Update field access: `user.accountId` (was `user.customerId`)
    - Update field access: `operation.account` (was `operation.customer`)

15. **`UserService.java`** (`com.janus.user.application`)
    - Update field: `user.accountId = request.accountId()` (was `customerId`)

16. **`CreateUserRequest.java`** / **`UpdateUserRequest.java`** / **`UserResponse.java`** (`com.janus.user.api.dto`)
    - Rename field: `Long accountId` (was `customerId`)

**Step 1: Update all files listed above**

For each file: read, apply the renames, write.

**Step 2: Run tests to verify compilation**

Run: `cd janus-backend && ./gradlew test`
Expected: Compilation succeeds. Tests may fail due to test files still using old names (fixed in Task 4).

**Step 3: Commit**

```
refactor: update all backend cross-references from Customer to Account
```

---

## Task 4: Backend Tests — Rename All Test References

**Files to modify:**

1. **`CustomerResourceTest.java`** → rename to **`AccountResourceTest.java`**
   - Update class name
   - Update all endpoint paths: `/api/accounts` (was `/api/customers`)
   - Update test data: `"accountTypes"` (was `"customerTypes"`), `"accountCode"` (was `"customerCode"`)

2. **`OperationResourceTest.java`**
   - Update test data: `"accountId"` (was `"customerId"`)

3. **`ValuationResourceTest.java`**
   - Update test data: `"accountId"` (was `"customerId"`)

4. **`DeclarationResourceTest.java`**
   - Rename variables: `accountApprovalOpId`, `accountApprovalDeclId`
   - Update test data: `"accountId"` (was `"customerId"`)

5. **`UserResourceTest.java`**
   - Update assertion: `.body("accountId", notNullValue())`

6. **`PermissionHardeningTest.java`**
   - Update comments: "account 1", "account 2"
   - Update test data and assertions: `accountId`

7. **`InspectionResourceTest.java`**
   - Update test data: `"accountId"` (was `"customerId"`)

**Step 1: Update all test files**

For each test file: read, apply renames, write. Rename `CustomerResourceTest.java` file to `AccountResourceTest.java`.

**Step 2: Run all tests**

Run: `cd janus-backend && ./gradlew test`
Expected: ALL tests pass.

**Step 3: Commit**

```
refactor: rename Customer to Account in all backend tests
```

---

## Task 5: Frontend Models and Service

**Files:**

1. **Rename** `src/app/core/models/customer.model.ts` → `src/app/core/models/account.model.ts`
   - Rename enum: `AccountType` (was `CustomerType`)
   - Rename interface: `Account` (was `Customer`)
   - Rename field: `accountTypes: AccountType[]` (was `customerTypes`)
   - Rename field: `accountCode` (was `customerCode`)
   - Rename interface: `AccountContact` (was `CustomerContact`)
   - Rename interface: `CreateAccountContactRequest` (was `CreateCustomerContactRequest`)
   - Rename interface: `CreateAccountRequest` (was `CreateCustomerRequest`)

2. **Rename** `src/app/core/services/customer.service.ts` → `src/app/core/services/account.service.ts`
   - Rename class: `AccountService` (was `CustomerService`)
   - Update API URL: `/api/accounts` (was `/api/customers`)
   - Update imports to use `Account`, `AccountContact`, `CreateAccountRequest`, `CreateAccountContactRequest`
   - Rename params: `accountId` (was `customerId`)

3. **Rename** `src/app/core/services/customer.service.spec.ts` → `src/app/core/services/account.service.spec.ts`
   - Update all references accordingly

4. **Update** `src/app/core/models/user.model.ts`
   - Rename field: `accountId` (was `customerId`) in User, Role, and UserDTO interfaces

5. **Update** `src/app/core/models/operation.model.ts`
   - Rename fields: `accountId`, `accountName` (was `customerId`, `customerName`)

6. **Update** `src/app/core/services/operation.service.ts`
   - Rename param: `accountId` (was `customerId`)
   - Update query param: `params.set('accountId', ...)`

7. **Update** `src/app/core/services/operation.service.spec.ts`
   - Update mock data and assertions

8. **Update** `src/app/core/services/auth.service.spec.ts`
   - Update mock data: `accountId: null`

**Step 1: Create new model and service files, delete old ones**

**Step 2: Update all cross-reference files**

**Step 3: Verify build**

Run: `cd janus-frontend && npx ng build`
Expected: Build may fail due to components not yet updated — that's expected.

**Step 4: Commit**

```
refactor: rename Customer to Account in frontend models and services
```

---

## Task 6: Frontend Feature Components — Accounts

**Files:**

1. **Move directory** `src/app/features/customers/` → `src/app/features/accounts/`

2. **Rename** `customer-list/` → `account-list/`
   - `account-list.component.ts` — Rename class to `AccountListComponent`, selector to `app-account-list`
   - Update imports: `AccountService`, `Account`, `AccountType`
   - Rename signals: `accounts` (was `customers`)
   - Rename all template bindings: `account.accountCode`, `account.accountTypes`, etc.
   - Update route links: `/accounts/new`, `/accounts/{id}/edit`
   - Update query params: `accountId` (was `customerId`)
   - Update i18n keys: `ACCOUNTS.*` (was `CUSTOMERS.*`), `ACCOUNT_TYPES.*` (was `CUSTOMER_TYPES.*`)

3. **Rename** `customer-form/` → `account-form/`
   - `account-form.component.ts` — Rename class to `AccountFormComponent`, selector to `app-account-form`
   - Update imports: `AccountService`, `AccountType`, `AccountContact`, etc.
   - Rename field: `accountId` (was `customerId`), `accountTypes` (was `customerTypes`)
   - Rename form control: `accountCode` (was `customerCode`)
   - Update all i18n keys in template

4. **Update spec files** for both components accordingly

**Step 1: Create new directory structure and files**

**Step 2: Delete old `features/customers/` directory**

**Step 3: Commit**

```
refactor: rename Customer to Account in frontend feature components
```

---

## Task 7: Frontend Cross-References — Operations, Users, Dashboard, Shared Components

**Files to modify:**

1. **`operation-form.component.ts`** + spec
   - Update imports: `AccountService`, `Account`
   - Rename signals: `accounts` (was `customers`), `selectedAccount` (was `selectedCustomer`), `selectedAccountDisplay`, `accountLocked`
   - Rename form control: `accountId`
   - Rename methods: `searchAccount`, `formatAccount`, `selectAccount`, `clearAccount`
   - Update i18n keys in template

2. **`operation-detail.component.ts`** + spec
   - Update template: `operation()!.accountName` (was `customerName`)

3. **`operation-list.component.ts`** + spec
   - Update template: `op.accountName` (was `customerName`)

4. **`inspection-panel.component.ts`**
   - Update imports: `AccountService`, `Account`
   - Rename signals and template bindings

5. **`payment-panel.component.ts`**
   - Update imports: `AccountService`, `Account`
   - Rename signals and template bindings

6. **`dashboard.component.html`** + spec
   - Update template: `op.accountName`

7. **`user-form.component.ts`**
   - Update imports: `AccountService`, `Account`
   - Rename signals: `accounts`, `selectedAccount`, `selectedAccountDisplay`
   - Rename form control: `accountId`

8. **`navbar.component.ts`**
   - Update route link: `routerLink="/accounts"` (was `/customers`)

9. **`sidebar.component.ts`** + spec
   - Update route link: `routerLink="/accounts"`
   - Update test assertion: `expect(hrefs).toContain('/accounts')`

10. **`charges-table.component.ts`**
    - Update import: `Account`
    - Rename input: `accounts` (was `customers`)

11. **`expense-detail-modal.component.ts`**
    - Update imports: `Account`, `AccountType`
    - Rename property: `accounts: Account[] = []`
    - Rename method: `searchAccount`
    - Update filtering: `accountTypes` (was `customerTypes`)

**Step 1: Update all files listed above**

**Step 2: Verify build**

Run: `cd janus-frontend && npx ng build`
Expected: Build succeeds.

**Step 3: Commit**

```
refactor: update all frontend cross-references from Customer to Account
```

---

## Task 8: Frontend Routing and i18n

**Files:**

1. **`app.routes.ts`**
   - Update paths: `accounts`, `accounts/new`, `accounts/:id/edit`
   - Update lazy imports to new component paths
   - Update component names: `AccountListComponent`, `AccountFormComponent`

2. **`src/assets/i18n/en.json`**
   - Rename section `"CUSTOMERS"` → `"ACCOUNTS"`
   - Rename section `"CUSTOMER_TYPES"` → `"ACCOUNT_TYPES"`
   - Update nav key: `"ACCOUNTS": "Accounts"`
   - Update operation keys: `"ACCOUNT"`, `"SELECT_ACCOUNT"`, `"ACCOUNT_SEARCH_PLACEHOLDER"`, `"CREATE_ACCOUNT"`
   - Update audit key: `"ACCOUNT": "Account"`
   - Update billing key: `"ACCOUNT": "Account"`
   - Update validation messages referencing "Customer" → "Account"
   - Keep the **values** (display text) as-is for now (e.g., "Customers" can stay or change to "Accounts" — user decides)

3. **`src/assets/i18n/es.json`**
   - Same key renames as en.json
   - Spanish display values: "Clientes" can stay or change to "Cuentas" — user decides

**Step 1: Update routing**

**Step 2: Update both i18n files**

Note on i18n values: The i18n **keys** must change to match the code. The display **values** (what users see in the UI) should be updated:
- English: "Customer" → "Account", "Customers" → "Accounts"
- Spanish: "Cliente" → "Cuenta", "Clientes" → "Cuentas"

**Step 3: Verify build**

Run: `cd janus-frontend && npx ng build`
Expected: Build succeeds.

**Step 4: Commit**

```
refactor: update frontend routing and i18n keys from Customer to Account
```

---

## Task 9: Full Verification — Run All Tests

**Step 1: Run backend tests**

Run: `cd janus-backend && ./gradlew test`
Expected: ALL tests pass.

**Step 2: Run frontend build**

Run: `cd janus-frontend && npx ng build`
Expected: Build succeeds with no errors.

**Step 3: Grep for stale references**

Run in both projects:
```bash
grep -ri "customer" janus-backend/src --include="*.java" | grep -v "// " | head -20
grep -ri "customer" janus-frontend/src --include="*.ts" --include="*.html" | head -20
grep -ri "CUSTOMER" janus-frontend/src/assets/i18n/ | head -20
```

Expected: No remaining references to "customer" (except possibly in comments or migration V1-V3 SQL files which are historical and must NOT be modified).

**Step 4: Fix any remaining references found in Step 3**

**Step 5: Run tests again if fixes were needed**

**Step 6: Commit any fixes**

```
fix: clean up remaining Customer references missed in rename
```

---

## Task 10: Functional Testing (Playwright)

| Change | Affected Areas | Tests to Run |
|--------|---------------|--------------|
| `/api/accounts` endpoint rename | Account list, Account form, Operation form (account selector), User form (account selector) | Navigate to all account-related pages, verify CRUD |
| Route `/accounts` rename | Navigation, sidebar links, direct URL access | Click nav links, verify routing |
| i18n key changes | All pages that display account-related labels | Verify labels render correctly (not showing raw keys) |
| Operation form account selector | Operation create/edit | Create operation, verify account dropdown works |

**Step 1: Start both servers**

Ensure backend (`./gradlew quarkusDev` on port 8080) and frontend (`ng serve` on port 4200) are running.

**Step 2: Test Account List page**

- Navigate to `http://localhost:4200/accounts`
- Verify the page loads with table of accounts
- Verify search works
- Verify type filter works
- Take screenshot: `screenshots/account-rename-01-list.png`

**Step 3: Test Account Form (create)**

- Click "New Account" button
- Verify form loads with correct labels (not "Customer")
- Fill form and submit
- Take screenshot: `screenshots/account-rename-02-form.png`

**Step 4: Test Account Form (edit)**

- Click edit on an existing account
- Verify data loads correctly
- Verify contacts section works
- Take screenshot: `screenshots/account-rename-03-edit.png`

**Step 5: Test Operation Form (account selector)**

- Navigate to create new operation
- Verify account typeahead works
- Take screenshot: `screenshots/account-rename-04-operation-form.png`

**Step 6: Test Navigation**

- Verify sidebar link says "Accounts" and navigates to `/accounts`
- Verify navbar link works
- Take screenshot: `screenshots/account-rename-05-navigation.png`

**Step 7: Test Dashboard**

- Navigate to dashboard
- Verify operation cards show `accountName` correctly
- Take screenshot: `screenshots/account-rename-06-dashboard.png`

---

## Important Notes

- **V1 is rewritten, V2 is updated, V3 is deleted** — the database will be dropped and recreated from scratch
- **DO NOT change the `customerCode` field's business meaning** — it's just renamed to `accountCode` in the code, the data stays the same
- The `CustomerType` enum values (COMPANY, CONSIGNEE, etc.) remain the same — only the enum name changes to `AccountType`
- The `ContactType` and `DocumentType` enums keep their names, only move packages
