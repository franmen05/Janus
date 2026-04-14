# Design: Rename Customer to Account

**Date:** 2026-04-13
**Status:** Approved

## Context

The `Customer` entity has evolved from representing only clients to supporting multiple types simultaneously (COMPANY, CONSIGNEE, INDIVIDUAL, SHIPPER, CARRIER). Some of these types (SHIPPER, CARRIER) are not actual customers — they are third parties participating in trade operations. The name "Customer" no longer accurately describes what the entity represents.

## Decision

Rename `Customer` → `Account`, following the CRM/ERP industry pattern where "Account" represents any registered entity in the system regardless of its commercial relationship.

### Why Account?

- **No domain conflict:** `User` covers authentication; no billing/accounting module planned
- **Scalable:** Future types (warehouses, customs brokers, insurers) fit naturally
- **Industry standard:** Account/AccountType is a well-known pattern in enterprise software
- **Concise:** 7 characters, shorter than alternatives like TradeParty

### Alternatives Considered

| Option | Rejected Because |
|--------|-----------------|
| `TradeParty` | Verbose, requires domain knowledge to understand |
| `Party` | Too generic, ambiguous outside context |
| `BusinessEntity` | Verbose, "Entity" conflicts with JPA terminology |

## Rename Map

### Backend (Java/Quarkus)

| Current | New |
|---------|-----|
| `com.janus.customer.*` | `com.janus.account.*` |
| `Customer.java` (entity) | `Account.java` |
| `CustomerType.java` (enum) | `AccountType.java` |
| `CustomerContact.java` (entity) | `AccountContact.java` |
| `ContactType.java` | `ContactType.java` (unchanged) |
| `DocumentType.java` | `DocumentType.java` (unchanged) |
| `CustomerService.java` | `AccountService.java` |
| `CustomerContactService.java` | `AccountContactService.java` |
| `CustomerRepository.java` | `AccountRepository.java` |
| `CustomerResource.java` | `AccountResource.java` |
| `CustomerContactResource.java` | `AccountContactResource.java` |
| `CreateCustomerRequest.java` | `CreateAccountRequest.java` |
| `CustomerResponse.java` | `AccountResponse.java` |
| `CreateCustomerContactRequest.java` | `CreateAccountContactRequest.java` |
| `CustomerContactResponse.java` | `AccountContactResponse.java` |

### Database

| Current Table | New Table |
|---------------|-----------|
| `customers` | `accounts` |
| `customer_types` | `account_types` |
| `customer_contacts` | `account_contacts` |

- Foreign keys in `operations` table: `customer_id` → `account_id`
- Foreign keys in `users` table: `customer_id` → `account_id`
- SQL migration script required (rename tables, columns, constraints)

### Frontend (Angular/TypeScript)

| Current | New |
|---------|-----|
| `customer.model.ts` | `account.model.ts` |
| `customer.service.ts` | `account.service.ts` |
| `features/customers/` | `features/accounts/` |
| `CustomerListComponent` | `AccountListComponent` |
| `CustomerFormComponent` | `AccountFormComponent` |
| Interface `Customer` | Interface `Account` |
| Enum `CustomerType` | Enum `AccountType` |
| Interface `CustomerContact` | Interface `AccountContact` |

### API Endpoints

| Current | New |
|---------|-----|
| `GET /api/customers` | `GET /api/accounts` |
| `GET /api/customers/{id}` | `GET /api/accounts/{id}` |
| `POST /api/customers` | `POST /api/accounts` |
| `PUT /api/customers/{id}` | `PUT /api/accounts/{id}` |
| `GET /api/customers/{id}/contacts` | `GET /api/accounts/{id}/contacts` |
| `POST /api/customers/{id}/contacts` | `POST /api/accounts/{id}/contacts` |
| `PUT /api/customers/{id}/contacts/{cid}` | `PUT /api/accounts/{id}/contacts/{cid}` |
| `DELETE /api/customers/{id}/contacts/{cid}` | `DELETE /api/accounts/{id}/contacts/{cid}` |

### i18n Keys

| Current | New |
|---------|-----|
| `CUSTOMERS.*` | `ACCOUNTS.*` |
| `CUSTOMER_TYPES.*` | `ACCOUNT_TYPES.*` |
| `NAV.CUSTOMERS` | `NAV.ACCOUNTS` |

Both `en.json` and `es.json` must be updated.

### Routes

| Current | New |
|---------|-----|
| `/customers` | `/accounts` |
| `/customers/new` | `/accounts/new` |
| `/customers/:id/edit` | `/accounts/:id/edit` |

### Cross-References

Other files that reference Customer and need updating:
- `Operation.java` — `customer` field → `account`
- `OperationService.java` — customer references
- `OperationResource.java` — customer query params
- `CreateOperationRequest.java` — `customerId` → `accountId`
- `OperationResponse.java` — customer fields
- `DataSeeder.java` — seed data references
- `SecurityHelper.java` — customer access checks
- `AuditEvent` messages — "Customer created" → "Account created"
- `import.sql` / migration scripts
- Frontend operation components that display/select customer
- Frontend routing (app.routes.ts)
- Frontend navigation (sidebar/menu)

## Migration Strategy

A Flyway SQL migration script will handle:
1. Rename tables
2. Rename columns (foreign keys)
3. Rename constraints
4. Update audit log messages (if stored)
