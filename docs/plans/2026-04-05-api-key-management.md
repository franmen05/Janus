# API Key Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement per-client API key management so external systems authenticate via dynamically generated keys instead of a single shared config key.

**Architecture:** New `ApiKey` entity stored in DB with SHA-256 hashed keys. The existing `ExternalApiKeyFilter` is modified to validate against DB. ADMIN manages keys via CRUD API + Angular UI. Keys have optional expiration and can be revoked.

**Tech Stack:** Quarkus 3.27.2, Java 21, Angular 20, Bootstrap 5, SHA-256 hashing, SecureRandom

**Design doc:** `docs/plans/2026-04-05-api-key-management-design.md`

---

## Task 1: Backend — ApiKey Entity + Repository

**Files:**
- Create: `janus-backend/src/main/java/com/janus/apikey/domain/model/ApiKey.java`
- Create: `janus-backend/src/main/java/com/janus/apikey/domain/repository/ApiKeyRepository.java`

**Step 1: Create ApiKey entity**

```java
// ApiKey.java
package com.janus.apikey.domain.model;

import com.janus.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "api_keys")
public class ApiKey extends BaseEntity {

    @Column(nullable = false)
    public String name;

    @Column(name = "key_hash", nullable = false, unique = true, length = 64)
    public String keyHash;

    @Column(name = "key_prefix", nullable = false, length = 12)
    public String keyPrefix;

    @Column(name = "expires_at")
    public LocalDateTime expiresAt;

    @Column(nullable = false)
    public boolean active = true;

    @Column(name = "created_by", nullable = false)
    public String createdBy;

    @Column(name = "last_used_at")
    public LocalDateTime lastUsedAt;

    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }

    public boolean isValid() {
        return active && !isExpired();
    }
}
```

**Step 2: Create ApiKeyRepository**

```java
// ApiKeyRepository.java
package com.janus.apikey.domain.repository;

import com.janus.apikey.domain.model.ApiKey;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;

@ApplicationScoped
public class ApiKeyRepository implements PanacheRepository<ApiKey> {

    public Optional<ApiKey> findByKeyHash(String keyHash) {
        return find("keyHash", keyHash).firstResultOptional();
    }

    public Optional<ApiKey> findActiveByKeyHash(String keyHash) {
        return find("keyHash = ?1 AND active = true", keyHash).firstResultOptional();
    }
}
```

---

## Task 2: Backend — ApiKeyService (Key Generation + Validation)

**Files:**
- Create: `janus-backend/src/main/java/com/janus/apikey/application/ApiKeyService.java`

**Step 1: Create ApiKeyService**

```java
// ApiKeyService.java
package com.janus.apikey.application;

import com.janus.apikey.domain.model.ApiKey;
import com.janus.apikey.domain.repository.ApiKeyRepository;
import com.janus.shared.infrastructure.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ApiKeyService {

    private static final String KEY_PREFIX = "jk_";
    private static final int KEY_LENGTH = 32;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Inject
    ApiKeyRepository apiKeyRepository;

    public List<ApiKey> listAll() {
        return apiKeyRepository.listAll();
    }

    /**
     * Creates a new API key. Returns the plaintext key (only available at creation time).
     */
    @Transactional
    public ApiKeyCreationResult create(String name, LocalDateTime expiresAt, String createdBy) {
        String rawKey = generateRawKey();
        String fullKey = KEY_PREFIX + rawKey;
        String keyHash = hashKey(fullKey);

        var apiKey = new ApiKey();
        apiKey.name = name;
        apiKey.keyHash = keyHash;
        apiKey.keyPrefix = fullKey.substring(0, 11);
        apiKey.expiresAt = expiresAt;
        apiKey.createdBy = createdBy;
        apiKeyRepository.persist(apiKey);

        return new ApiKeyCreationResult(apiKey, fullKey);
    }

    @Transactional
    public void revoke(Long id) {
        var apiKey = apiKeyRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("ApiKey", id));
        apiKey.active = false;
    }

    /**
     * Validates an API key and returns the ApiKey entity if valid.
     * Updates lastUsedAt on successful validation.
     */
    @Transactional
    public Optional<ApiKey> validate(String rawKey) {
        String keyHash = hashKey(rawKey);
        var optKey = apiKeyRepository.findActiveByKeyHash(keyHash);
        if (optKey.isPresent()) {
            var apiKey = optKey.get();
            if (apiKey.isExpired()) {
                return Optional.empty();
            }
            apiKey.lastUsedAt = LocalDateTime.now();
            return Optional.of(apiKey);
        }
        return Optional.empty();
    }

    private String generateRawKey() {
        byte[] bytes = new byte[KEY_LENGTH];
        SECURE_RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    static String hashKey(String key) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(key.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    public record ApiKeyCreationResult(ApiKey apiKey, String plaintextKey) {}
}
```

---

## Task 3: Backend — DTOs + ApiKeyResource

**Files:**
- Create: `janus-backend/src/main/java/com/janus/apikey/api/dto/CreateApiKeyRequest.java`
- Create: `janus-backend/src/main/java/com/janus/apikey/api/dto/ApiKeyResponse.java`
- Create: `janus-backend/src/main/java/com/janus/apikey/api/dto/ApiKeyCreatedResponse.java`
- Create: `janus-backend/src/main/java/com/janus/apikey/api/ApiKeyResource.java`

**Step 1: Create DTOs**

```java
// CreateApiKeyRequest.java
package com.janus.apikey.api.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public record CreateApiKeyRequest(
        @NotBlank String name,
        LocalDateTime expiresAt
) {}
```

```java
// ApiKeyResponse.java
package com.janus.apikey.api.dto;

import com.janus.apikey.domain.model.ApiKey;
import java.time.LocalDateTime;

public record ApiKeyResponse(
        Long id,
        String name,
        String keyPrefix,
        LocalDateTime expiresAt,
        boolean active,
        String createdBy,
        LocalDateTime lastUsedAt,
        LocalDateTime createdAt
) {
    public static ApiKeyResponse from(ApiKey apiKey) {
        return new ApiKeyResponse(
                apiKey.id,
                apiKey.name,
                apiKey.keyPrefix,
                apiKey.expiresAt,
                apiKey.active,
                apiKey.createdBy,
                apiKey.lastUsedAt,
                apiKey.createdAt
        );
    }
}
```

```java
// ApiKeyCreatedResponse.java
package com.janus.apikey.api.dto;

import com.janus.apikey.domain.model.ApiKey;
import java.time.LocalDateTime;

public record ApiKeyCreatedResponse(
        Long id,
        String name,
        String keyPrefix,
        String key,
        LocalDateTime expiresAt,
        boolean active,
        LocalDateTime createdAt
) {
    public static ApiKeyCreatedResponse from(ApiKey apiKey, String plaintextKey) {
        return new ApiKeyCreatedResponse(
                apiKey.id,
                apiKey.name,
                apiKey.keyPrefix,
                plaintextKey,
                apiKey.expiresAt,
                apiKey.active,
                apiKey.createdAt
        );
    }
}
```

**Step 2: Create ApiKeyResource**

```java
// ApiKeyResource.java
package com.janus.apikey.api;

import com.janus.apikey.api.dto.ApiKeyCreatedResponse;
import com.janus.apikey.api.dto.ApiKeyResponse;
import com.janus.apikey.api.dto.CreateApiKeyRequest;
import com.janus.apikey.application.ApiKeyService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import java.util.List;

@Path("/api/api-keys")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("ADMIN")
public class ApiKeyResource {

    @Inject
    ApiKeyService apiKeyService;

    @GET
    public List<ApiKeyResponse> list() {
        return apiKeyService.listAll().stream()
                .map(ApiKeyResponse::from)
                .toList();
    }

    @POST
    public Response create(@Valid CreateApiKeyRequest request, @Context SecurityContext sec) {
        var result = apiKeyService.create(
                request.name(),
                request.expiresAt(),
                sec.getUserPrincipal().getName()
        );
        return Response.status(Response.Status.CREATED)
                .entity(ApiKeyCreatedResponse.from(result.apiKey(), result.plaintextKey()))
                .build();
    }

    @DELETE
    @Path("/{id}")
    public Response revoke(@PathParam("id") Long id) {
        apiKeyService.revoke(id);
        return Response.noContent().build();
    }
}
```

---

## Task 4: Backend — Modify ExternalApiKeyFilter

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/shared/infrastructure/security/ExternalApiKeyFilter.java`

**Step 1: Replace config-based validation with DB-based validation**

The filter should:
1. Keep the path check (only `/api/external/*`)
2. Remove the `@ConfigProperty` for single key
3. Inject `ApiKeyService` instead
4. Hash the received key, validate against DB
5. Store the API key name as the external username (for audit)
6. Keep fallback to config key for backward compatibility during migration

```java
// Full replacement for ExternalApiKeyFilter.java
package com.janus.shared.infrastructure.security;

import com.janus.apikey.application.ApiKeyService;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@Provider
@Priority(Priorities.AUTHENTICATION)
public class ExternalApiKeyFilter implements ContainerRequestFilter {

    public static final String API_KEY_HEADER = "X-API-Key";
    public static final String EXTERNAL_USER_PROPERTY = "external.username";

    @Inject
    ApiKeyService apiKeyService;

    @ConfigProperty(name = "janus.external.api-key", defaultValue = "")
    String legacyApiKey;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        String path = requestContext.getUriInfo().getPath();

        if (!path.startsWith("/api/external/") && !path.startsWith("api/external/")) {
            return;
        }

        String apiKey = requestContext.getHeaderString(API_KEY_HEADER);

        if (apiKey == null || apiKey.isBlank()) {
            requestContext.abortWith(
                Response.status(Response.Status.UNAUTHORIZED)
                    .type(MediaType.APPLICATION_JSON_TYPE)
                    .entity(java.util.Map.of("error", "Missing API key"))
                    .build()
            );
            return;
        }

        // Try DB-managed keys first
        var validKey = apiKeyService.validate(apiKey);
        if (validKey.isPresent()) {
            requestContext.setProperty(EXTERNAL_USER_PROPERTY, "apikey:" + validKey.get().name);
            return;
        }

        // Fallback to legacy config key
        if (!legacyApiKey.isBlank() && legacyApiKey.equals(apiKey)) {
            requestContext.setProperty(EXTERNAL_USER_PROPERTY, "external-billing-system");
            return;
        }

        requestContext.abortWith(
            Response.status(Response.Status.UNAUTHORIZED)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(java.util.Map.of("error", "Invalid API key"))
                .build()
        );
    }
}
```

**Step 2: Update application.properties**

Change the legacy key config to have defaultValue so it's optional:
```properties
janus.external.api-key=${EXTERNAL_API_KEY:}
```
The empty default means: if no env var, legacy key is disabled (only DB keys work).

For test profile, keep the test key so existing tests pass:
```properties
%test.janus.external.api-key=test-api-key-secret
```

**Step 3: Run tests**

Run: `cd janus-backend && ./gradlew test`
Expected: All existing tests pass (legacy key still works via fallback)

**Step 4: Commit**

```
feat: add API key management with DB-backed validation

New ApiKey entity with SHA-256 hashed keys, optional expiration,
and revocation. ADMIN-only CRUD via /api/api-keys. ExternalApiKeyFilter
now validates against DB with legacy config fallback.
```

---

## Task 5: Frontend — Model + Service

**Files:**
- Create: `janus-frontend/src/app/core/models/api-key.model.ts`
- Create: `janus-frontend/src/app/core/services/api-key.service.ts`

**Step 1: Create TypeScript interfaces**

```typescript
// api-key.model.ts
export interface ApiKey {
  id: number;
  name: string;
  keyPrefix: string;
  expiresAt: string | null;
  active: boolean;
  createdBy: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface ApiKeyCreated extends ApiKey {
  key: string;
}

export interface CreateApiKeyRequest {
  name: string;
  expiresAt: string | null;
}
```

**Step 2: Create API service**

```typescript
// api-key.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiKey, ApiKeyCreated, CreateApiKeyRequest } from '../models/api-key.model';

@Injectable({ providedIn: 'root' })
export class ApiKeyService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/api-keys`;

  getAll(): Observable<ApiKey[]> {
    return this.http.get<ApiKey[]>(this.apiUrl);
  }

  create(request: CreateApiKeyRequest): Observable<ApiKeyCreated> {
    return this.http.post<ApiKeyCreated>(this.apiUrl, request);
  }

  revoke(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

---

## Task 6: Frontend — API Key List Component

**Files:**
- Create: `janus-frontend/src/app/features/api-keys/api-key-list/api-key-list.component.ts`

**Step 1: Create list component with inline template**

Follow the same pattern as `user-list.component.ts`. Use Bootstrap table with columns: Name, Key Prefix, Expires, Status, Created By, Last Used, Actions. Include "New API Key" button and "Revoke" action per row.

When creating a key, show a modal/alert with the plaintext key and a "Copy" button, with warning "This key will not be shown again."

The component should:
- Load keys on init via `ApiKeyService.getAll()`
- Have a create form (name + optional expiresAt)
- Show the created key in an alert after creation
- Revoke keys with confirmation
- Use signals for reactive state
- Use `@for` directive for table rows
- Use TranslateModule for i18n
- Use LoadingIndicatorComponent while loading
- Display expired/revoked keys with appropriate badge styling

---

## Task 7: Frontend — Routing + Navigation + i18n

**Files:**
- Modify: `janus-frontend/src/app/app.routes.ts`
- Modify: `janus-frontend/src/app/shared/components/sidebar/sidebar.component.ts`
- Modify: `janus-frontend/src/app/shared/components/navbar/navbar.component.ts`
- Modify: `janus-frontend/src/assets/i18n/en.json`
- Modify: `janus-frontend/src/assets/i18n/es.json`

**Step 1: Add route**

In `app.routes.ts`, add after the exchange-rates routes block:
```typescript
{
  path: 'api-keys',
  loadComponent: () => import('./features/api-keys/api-key-list/api-key-list.component').then(m => m.ApiKeyListComponent),
  data: { roles: ['ADMIN'] },
  canActivate: [roleGuard]
},
```

**Step 2: Add sidebar link**

In `sidebar.component.ts`, after line 158 (the Expense Categories `</li>`), add:
```html
<li class="nav-item">
  <a class="nav-link" routerLink="/api-keys" routerLinkActive="active"
     [ngbTooltip]="sidebarService.collapsed() ? ('NAV.API_KEYS' | translate) : null"
     placement="end" container="body">
    <i class="bi bi-key"></i>
    @if (!sidebarService.collapsed()) {
      <span>{{ 'NAV.API_KEYS' | translate }}</span>
    }
  </a>
</li>
```

Also update the `ngOnInit` URL check to include `/api-keys` for auto-expanding the config section.

**Step 3: Add navbar link (mobile)**

In `navbar.component.ts`, add after Expense Categories menu item:
```html
<a class="dropdown-item ps-4" routerLink="/api-keys" routerLinkActive="active">
  <i class="bi bi-key me-2"></i>{{ 'NAV.API_KEYS' | translate }}
</a>
```

**Step 4: Add i18n keys**

In `en.json`:
- NAV section: `"API_KEYS": "API Keys"`
- New API_KEYS section:
```json
"API_KEYS": {
  "TITLE": "API Keys",
  "NEW": "New API Key",
  "NAME": "Name",
  "KEY_PREFIX": "Key Prefix",
  "EXPIRES_AT": "Expires",
  "STATUS": "Status",
  "CREATED_BY": "Created By",
  "LAST_USED": "Last Used",
  "ACTIVE": "Active",
  "REVOKED": "Revoked",
  "EXPIRED": "Expired",
  "NEVER": "Never",
  "NEVER_USED": "Never used",
  "REVOKE": "Revoke",
  "REVOKE_CONFIRM": "Are you sure you want to revoke this API key?",
  "CREATED_SUCCESS": "API key created successfully",
  "REVOKED_SUCCESS": "API key revoked successfully",
  "COPY_KEY": "Copy Key",
  "KEY_WARNING": "This key will not be shown again. Copy it now.",
  "KEY_COPIED": "Key copied to clipboard",
  "NAME_PLACEHOLDER": "e.g. Billing System",
  "NO_KEYS": "No API keys found"
}
```

In `es.json`:
- NAV section: `"API_KEYS": "Claves API"`
- New API_KEYS section:
```json
"API_KEYS": {
  "TITLE": "Claves API",
  "NEW": "Nueva Clave API",
  "NAME": "Nombre",
  "KEY_PREFIX": "Prefijo",
  "EXPIRES_AT": "Expira",
  "STATUS": "Estado",
  "CREATED_BY": "Creado por",
  "LAST_USED": "Último uso",
  "ACTIVE": "Activa",
  "REVOKED": "Revocada",
  "EXPIRED": "Expirada",
  "NEVER": "Nunca",
  "NEVER_USED": "Sin uso",
  "REVOKE": "Revocar",
  "REVOKE_CONFIRM": "¿Está seguro que desea revocar esta clave API?",
  "CREATED_SUCCESS": "Clave API creada exitosamente",
  "REVOKED_SUCCESS": "Clave API revocada exitosamente",
  "COPY_KEY": "Copiar Clave",
  "KEY_WARNING": "Esta clave no se mostrará de nuevo. Cópiela ahora.",
  "KEY_COPIED": "Clave copiada al portapapeles",
  "NAME_PLACEHOLDER": "ej. Sistema de Facturación",
  "NO_KEYS": "No se encontraron claves API"
}
```

**Step 5: Build and verify**

Run: `cd janus-frontend && npx ng build`
Expected: Build succeeds

**Step 6: Commit**

```
feat: add API key management UI with list, create, and revoke
```

---

## Task 8: Verification — Backend Tests + Functional Tests

**Step 1: Run backend tests**

Run: `cd janus-backend && ./gradlew test`
Expected: All tests pass (including existing ExternalPaymentResourceTest with legacy key)

**Step 2: Run frontend build**

Run: `cd janus-frontend && npx ng build`
Expected: Build succeeds

**Step 3: Functional tests with Playwright**

1. Login as admin → navigate to /api-keys → verify empty list
2. Create new API key "Test Billing" with no expiration → verify key displayed → copy key
3. Verify key appears in list with correct name, prefix, status "Active"
4. Use the copied key to call `/api/external/operations/{id}/liquidation/payment` → verify 200/201
5. Create key with expiration in the past → verify it shows as "Expired"
6. Revoke a key → verify status changes to "Revoked"
7. Use revoked key → verify 401
8. Test endpoint de clientes con API key: call `/api/external/` endpoints
9. Login as agent → navigate to /api-keys → verify redirect to dashboard (ADMIN-only)

---

## Functional Testing

| Change | Affected Areas | Tests to Run |
|--------|---------------|--------------|
| ApiKey entity + DB | Database schema | Backend tests, verify table creation |
| ExternalApiKeyFilter modified | All /api/external/* endpoints | Test billing payment endpoint with new key |
| API key CRUD | /api/api-keys endpoints | Create, list, revoke via API |
| Frontend API key UI | Configuration menu, api-keys page | Playwright: create, copy, revoke |
| Legacy key fallback | Existing external integrations | Existing ExternalPaymentResourceTest passes |
| Sidebar/navbar changes | Navigation menus | Verify API Keys link visible for ADMIN only |
