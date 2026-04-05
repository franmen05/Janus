# API Key Management Design

## Context

External systems (billing, ERP) need to authenticate against Janus `/api/external/*` endpoints. Currently there's a single shared API key hardcoded in config (`ExternalApiKeyFilter`). This doesn't support: multiple clients, expiration, revocation, or audit per-key. We need per-client API keys, dynamically generated, with optional expiration.

## Requirements

- API keys generated per external system, stored hashed in DB
- Optional expiration date (null = no expiration)
- Revocable (soft delete: active=false)
- ADMIN-only management (CRUD via API + UI)
- Only grants access to `/api/external/*` endpoints
- Key shown in plaintext only once at creation time
- Audit: track which key was used and when

## Data Model

```sql
CREATE TABLE api_keys (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,          -- descriptive name ("Billing System")
    key_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 of the key
    key_prefix VARCHAR(12) NOT NULL,      -- first 8 chars for display ("jk_a3b4...")
    expires_at TIMESTAMP,                 -- null = never expires
    active BOOLEAN NOT NULL DEFAULT true, -- soft revocation
    created_by VARCHAR(255) NOT NULL,     -- admin username who created it
    last_used_at TIMESTAMP,               -- tracking
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);
```

## API Key Format

`jk_<32 hex chars>` — Example: `jk_a3b4c5d6e7f8091a2b3c4d5e6f7a8b90`

Generated using `SecureRandom`. Stored as SHA-256 hash only.

## API Endpoints

```
POST   /api/api-keys          @RolesAllowed("ADMIN")
  Request:  { name: String, expiresAt?: LocalDateTime }
  Response: { id, name, keyPrefix, key (plaintext), expiresAt, active, createdAt } (201)

GET    /api/api-keys          @RolesAllowed("ADMIN")
  Response: [{ id, name, keyPrefix, expiresAt, active, createdBy, lastUsedAt, createdAt }]

DELETE /api/api-keys/{id}     @RolesAllowed("ADMIN")
  Response: 204 (sets active=false)
```

## Authentication Flow

1. External system sends: `X-API-Key: jk_a3b4c5d6...`
2. `ExternalApiKeyFilter` computes SHA-256 of received key
3. Queries DB: `SELECT * FROM api_keys WHERE key_hash = ? AND active = true`
4. Checks expiration: `expires_at IS NULL OR expires_at > NOW()`
5. Updates `last_used_at`
6. Sets request property with key name for audit trail
7. If invalid/expired: 401 Unauthorized

## Backend Files

| File | Change |
|------|--------|
| NEW `apikey/domain/model/ApiKey.java` | Entity |
| NEW `apikey/domain/repository/ApiKeyRepository.java` | Repository |
| NEW `apikey/application/ApiKeyService.java` | Business logic + key generation |
| NEW `apikey/api/ApiKeyResource.java` | CRUD endpoints |
| NEW `apikey/api/dto/CreateApiKeyRequest.java` | Request DTO |
| NEW `apikey/api/dto/ApiKeyResponse.java` | Response DTO |
| NEW `apikey/api/dto/ApiKeyCreatedResponse.java` | Response with plaintext key |
| MODIFY `ExternalApiKeyFilter.java` | Validate against DB instead of config |
| MODIFY `application.properties` | Remove old `janus.external.api-key` (keep as fallback) |

## Frontend Files

| File | Change |
|------|--------|
| NEW `features/api-keys/api-key-list/` | List component with table |
| NEW `features/api-keys/api-key-create-modal/` | Create modal with copy key |
| NEW `core/services/api-key.service.ts` | HTTP service |
| NEW `core/models/api-key.model.ts` | TypeScript interfaces |
| MODIFY `app.routes.ts` | Add /api-keys route (ADMIN) |
| MODIFY sidebar + navbar | Add "API Keys" link under Configuration |
| MODIFY `en.json` / `es.json` | i18n keys |

## Verification

- Backend tests: create key, list keys, revoke key, auth with valid/invalid/expired key
- Functional tests: login as admin, create API key, copy key, use key against `/api/external/operations/{id}/liquidation/payment`
- Test endpoints de factura y clientes con API key válida
- Test key expirada devuelve 401
- Test key revocada devuelve 401
