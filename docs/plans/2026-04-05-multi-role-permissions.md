# Multi-Role Permissions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Change user permission model from single-role to multi-role using `@ElementCollection`, clean up `@RolesAllowed` duplication, and update frontend to support multiple roles per user.

**Architecture:** Backend User entity changes from `String role` to `Set<String> roles` with JPA `@ElementCollection` creating a `user_roles` join table. Quarkus Security JPA natively supports this pattern. Frontend changes `role: string` to `roles: string[]` and updates `hasRole()` to check array intersection.

**Tech Stack:** Quarkus 3.27.2, Java 21, Angular 20, Bootstrap 5, Quarkus Security JPA

**Design doc:** `docs/plans/2026-04-05-multi-role-permissions-design.md`

---

## Task 1: Backend — Role Enum + User Entity

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/user/domain/model/Role.java`
- Modify: `janus-backend/src/main/java/com/janus/user/domain/model/User.java`

**Step 1: Add SUPERVISOR to Role enum**

```java
// Role.java — full file
package com.janus.user.domain.model;

public enum Role {
    ADMIN,
    SUPERVISOR,
    AGENT,
    ACCOUNTING,
    CUSTOMER,
    CARRIER
}
```

**Step 2: Change User entity from single role to multi-role**

In `User.java`, replace:
```java
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
```
With:
```java
import jakarta.persistence.*;
```

Replace field + helper methods:
```java
    @Roles
    @Column(nullable = false)
    public String role;

    @Column(nullable = false)
    public boolean active = true;

    @Column(name = "customer_id")
    public Long customerId;

    @Transient
    public Role getRoleEnum() {
        return Role.valueOf(role);
    }

    public void setRoleEnum(Role roleEnum) {
        this.role = roleEnum.name();
    }
```
With:
```java
    @Roles
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role")
    public Set<String> roles = new HashSet<>();

    @Column(nullable = false)
    public boolean active = true;

    @Column(name = "customer_id")
    public Long customerId;

    public Set<Role> getRoleEnums() {
        return roles.stream().map(Role::valueOf).collect(java.util.stream.Collectors.toSet());
    }

    public void setRoleEnums(Set<Role> roleEnums) {
        this.roles = roleEnums.stream().map(Role::name).collect(java.util.stream.Collectors.toSet());
    }

    public boolean hasRole(String role) {
        return roles.contains(role);
    }
```

Add imports at top of User.java:
```java
import java.util.HashSet;
import java.util.Set;
```

**Step 3: Verify build compiles (expect compilation errors in dependent files — that's OK, we fix them next)**

Run: `cd janus-backend && ./gradlew compileJava 2>&1 | head -50`
Expected: Compilation errors in UserService, SecurityHelper, DataSeeder, UserResponse (they still reference `user.role`)

---

## Task 2: Backend — DTOs

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/user/api/dto/UserResponse.java`
- Modify: `janus-backend/src/main/java/com/janus/user/api/dto/CreateUserRequest.java`
- Modify: `janus-backend/src/main/java/com/janus/user/api/dto/UpdateUserRequest.java`

**Step 1: Update UserResponse**

```java
// UserResponse.java — full file
package com.janus.user.api.dto;

import com.janus.user.domain.model.User;
import java.time.LocalDateTime;
import java.util.List;

public record UserResponse(
        Long id,
        String username,
        String fullName,
        String email,
        List<String> roles,
        boolean active,
        Long customerId,
        LocalDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.id,
                user.username,
                user.fullName,
                user.email,
                List.copyOf(user.roles),
                user.active,
                user.customerId,
                user.createdAt
        );
    }
}
```

**Step 2: Update CreateUserRequest**

```java
// CreateUserRequest.java — full file
package com.janus.user.api.dto;

import com.janus.user.domain.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CreateUserRequest(
        @NotBlank String username,
        @NotBlank String password,
        @NotBlank String fullName,
        @NotBlank @Email String email,
        @NotEmpty List<Role> roles,
        Long customerId
) {}
```

**Step 3: Update UpdateUserRequest**

```java
// UpdateUserRequest.java — full file
package com.janus.user.api.dto;

import com.janus.user.domain.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record UpdateUserRequest(
        @NotBlank String fullName,
        @NotBlank @Email String email,
        @NotEmpty List<Role> roles,
        Long customerId,
        boolean active,
        String password
) {}
```

---

## Task 3: Backend — UserService

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/user/application/UserService.java`

**Step 1: Update create method**

Replace line `user.role = request.role().name();` with:
```java
        user.roles = request.roles().stream()
                .map(Role::name)
                .collect(java.util.stream.Collectors.toSet());
```

**Step 2: Update update method**

Replace line `user.role = request.role().name();` with:
```java
        user.roles = request.roles().stream()
                .map(Role::name)
                .collect(java.util.stream.Collectors.toSet());
```

Add import:
```java
import com.janus.user.domain.model.Role;
```

---

## Task 4: Backend — SecurityHelper

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/shared/infrastructure/security/SecurityHelper.java`

**Step 1: Update CUSTOMER checks**

Replace `"CUSTOMER".equals(user.role)` (appears twice, lines 23 and 32) with `user.hasRole("CUSTOMER")`.

The `isCustomer` method at line 42 uses `sec.isUserInRole("CUSTOMER")` which already works with multi-role (Quarkus SecurityContext checks all roles). No change needed there.

---

## Task 5: Backend — DataSeeder

**Files:**
- Modify: `janus-backend/src/main/java/com/janus/shared/infrastructure/DataSeeder.java`

**Step 1: Update createUser helper to accept Set of roles**

Replace the `createUser` method at the bottom of the file:
```java
    private void createUser(String username, String password, String fullName,
                             String email, Role role, Long customerId) {
        var user = new User();
        user.username = username;
        user.password = BcryptUtil.bcryptHash(password);
        user.fullName = fullName;
        user.email = email;
        user.role = role.name();
        user.customerId = customerId;
        userRepository.persist(user);
    }
```
With:
```java
    private void createUser(String username, String password, String fullName,
                             String email, Set<Role> roles, Long customerId) {
        var user = new User();
        user.username = username;
        user.password = BcryptUtil.bcryptHash(password);
        user.fullName = fullName;
        user.email = email;
        user.roles = roles.stream().map(Role::name).collect(java.util.stream.Collectors.toSet());
        user.customerId = customerId;
        userRepository.persist(user);
    }
```

**Step 2: Update seedUsers calls + add SUPERVISOR user**

Replace the `seedUsers` method:
```java
    private void seedUsers() {
        var firstCustomer = customerRepository.find("ORDER BY id").firstResult();
        Long firstCustomerId = firstCustomer != null ? firstCustomer.id : null;

        createUser("admin", "admin123", "System Administrator", "admin@janus.com", Set.of(Role.ADMIN), null);
        createUser("supervisor", "super123", "Supervisor", "supervisor@janus.com", Set.of(Role.AGENT, Role.SUPERVISOR), null);
        createUser("agent", "agent123", "Customs Agent", "agent@janus.com", Set.of(Role.AGENT), null);
        createUser("accounting", "acc123", "Accounting User", "accounting@janus.com", Set.of(Role.ACCOUNTING), null);
        createUser("client", "client123", "Demo Client User", "client@demo.com", Set.of(Role.CUSTOMER), firstCustomerId);
        createUser("carrier", "carrier123", "Demo Carrier", "carrier@demo.com", Set.of(Role.CARRIER), null);
    }
```

Add import:
```java
import java.util.Set;
```

**Step 3: Build and run tests**

Run: `cd janus-backend && ./gradlew test`
Expected: All tests pass (compilation succeeds, DataSeeder seeds correctly)

**Step 4: Commit**

```
feat: change user model from single-role to multi-role with @ElementCollection
```

---

## Task 6: Backend — Clean @RolesAllowed Annotations

**Files:** All Resource files listed below.

**Rule:** Remove SUPERVISOR from every `@RolesAllowed` where AGENT is already present. SUPERVISOR users will have `[AGENT, SUPERVISOR]` roles, so they access AGENT endpoints via their AGENT role.

**Keep SUPERVISOR only where it has exclusive access (no AGENT):**
- `AuditResource.list()` — `@RolesAllowed({"SUPERVISOR", "ADMIN"})` — KEEP as-is
- `DeclarationResource.approveFinal()` — `@RolesAllowed({"SUPERVISOR", "ADMIN", "CUSTOMER"})` — KEEP as-is (no AGENT)
- `PaymentPanel approve button` — `@RolesAllowed({"ADMIN", "SUPERVISOR"})` — KEEP as-is (frontend only)

**Changes by file (remove SUPERVISOR from these annotations):**

### OperationResource.java
| Line | Before | After |
|------|--------|-------|
| 48 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` | `{"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` |
| 79 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER", "CARRIER"}` | `{"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER", "CARRIER"}` |
| 99 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 107 | `{"SUPERVISOR","ADMIN", "AGENT", "CARRIER"}` | `{"ADMIN", "AGENT", "CARRIER"}` |
| 126 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 138 | `{"SUPERVISOR","ADMIN", "AGENT", "CARRIER"}` | `{"ADMIN", "AGENT", "CARRIER"}` |
| 147 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` | `{"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` |

### CommentResource.java
| Line | Before | After |
|------|--------|-------|
| 38 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 50 | `{"ADMIN", "SUPERVISOR","AGENT", "ACCOUNTING", "CUSTOMER"}` | `{"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` |

### AlertResource.java
| Line | Before | After |
|------|--------|-------|
| 40 | `{"ADMIN","SUPERVISOR", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 49 | `{"ADMIN", "AGENT","SUPERVISOR", "ACCOUNTING", "CUSTOMER"}` | `{"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` |
| 68 | `{"ADMIN","SUPERVISOR", "AGENT"}` | `{"ADMIN", "AGENT"}` |

### LiquidationResource.java
| Line | Before | After |
|------|--------|-------|
| 46 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 60 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` | `{"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` |
| 87 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 112 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` | `{"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` |

### DocumentResource.java
| Line | Before | After |
|------|--------|-------|
| 50 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` | `{"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` |
| 72 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` | `{"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` |
| 83 | `{"SUPERVISOR","ADMIN", "AGENT", "CARRIER"}` | `{"ADMIN", "AGENT", "CARRIER"}` |
| 124 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` | `{"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` |
| 148 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` | `{"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` |
| 162 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` | `{"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` |
| 183 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 191 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` | `{"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` |

### DocumentTypeConfigResource.java
| Line | Before | After |
|------|--------|-------|
| 28 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` | `{"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` |

### ComplianceResource.java
| Line | Before | After |
|------|--------|-------|
| 28 | `{"ADMIN", "SUPERVISOR", "AGENT"}` | `{"ADMIN", "AGENT"}` |

### InspectionResource.java
| Line | Before | After |
|------|--------|-------|
| 57 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 69 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 95 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` | `{"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` |
| 108 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` | `{"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` |
| 135 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 147 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING"}` | `{"ADMIN", "AGENT", "ACCOUNTING"}` |
| 163 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 175 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 185 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING"}` | `{"ADMIN", "AGENT", "ACCOUNTING"}` |
| 192 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |

### DashboardResource.java
| Line | Before | After |
|------|--------|-------|
| 26 | `{"ADMIN", "SUPERVISOR", "AGENT", "ACCOUNTING"}` | `{"ADMIN", "AGENT", "ACCOUNTING"}` |

### AuditResource.java
| Line | Before | After |
|------|--------|-------|
| 35 | `{"SUPERVISOR","ADMIN"}` | **NO CHANGE** — SUPERVISOR-exclusive (no AGENT) |
| 51 | `{"SUPERVISOR","ADMIN", "AGENT", "CUSTOMER"}` | `{"ADMIN", "AGENT", "CUSTOMER"}` |

### PortResource.java
| Line | Before | After |
|------|--------|-------|
| 44 | `{"ADMIN", "SUPERVISOR", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 53 | `{"ADMIN", "SUPERVISOR", "AGENT"}` | `{"ADMIN", "AGENT"}` |

### TimelineResource.java
| Line | Before | After |
|------|--------|-------|
| 34 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` | `{"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` |

### ValuationResource.java
| Line | Before | After |
|------|--------|-------|
| 40 | `{"ADMIN", "SUPERVISOR", "AGENT", "ACCOUNTING"}` | `{"ADMIN", "AGENT", "ACCOUNTING"}` |
| 49 | `{"ADMIN", "SUPERVISOR", "AGENT", "ACCOUNTING"}` | `{"ADMIN", "AGENT", "ACCOUNTING"}` |
| 59 | `{"ADMIN", "SUPERVISOR", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 71 | `{"ADMIN", "SUPERVISOR", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 82 | `{"ADMIN", "SUPERVISOR", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 94 | `{"ADMIN", "SUPERVISOR", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 105 | `{"ADMIN", "SUPERVISOR", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 114 | `{"ADMIN", "SUPERVISOR", "AGENT"}` | `{"ADMIN", "AGENT"}` |

### CustomerResource.java (class-level)
| Line | Before | After |
|------|--------|-------|
| 25 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |

### DeclarationResource.java
| Line | Before | After |
|------|--------|-------|
| 49 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 60 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 70 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` | `{"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` |
| 81 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` | `{"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` |
| 91 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 103 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 116 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING"}` | `{"ADMIN", "AGENT", "ACCOUNTING"}` |
| 126 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 140 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 154 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` | `{"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER"}` |
| 187 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 198 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 211 | `{"SUPERVISOR","ADMIN", "CUSTOMER"}` | **NO CHANGE** — SUPERVISOR-exclusive (no AGENT) |
| 225 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 238 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 248 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |
| 260 | `{"SUPERVISOR","ADMIN", "AGENT"}` | `{"ADMIN", "AGENT"}` |

### UserResource.java
| Line | Before | After |
|------|--------|-------|
| 68 | `{"SUPERVISOR","ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER", "CARRIER"}` | `{"ADMIN", "AGENT", "ACCOUNTING", "CUSTOMER", "CARRIER"}` |

### ExchangeRateResource.java
| Line | Before | After |
|------|--------|-------|
| 54 | `{"ADMIN", "SUPERVISOR", "AGENT", "ACCOUNTING"}` | `{"ADMIN", "AGENT", "ACCOUNTING"}` |
| 61 | `{"ADMIN", "SUPERVISOR", "AGENT"}` | `{"ADMIN", "AGENT"}` |

### ExpenseCategoryResource.java
| Line | Before | After |
|------|--------|-------|
| 34 | `{"ADMIN", "SUPERVISOR", "AGENT", "ACCOUNTING"}` | `{"ADMIN", "AGENT", "ACCOUNTING"}` |

**Step 1: Apply all changes above**

**Step 2: Run tests**

Run: `cd janus-backend && ./gradlew test`
Expected: All tests pass

**Step 3: Commit**

```
refactor: clean @RolesAllowed annotations — remove SUPERVISOR where AGENT present
```

---

## Task 7: Frontend — User Model + Auth Service

**Files:**
- Modify: `janus-frontend/src/app/core/models/user.model.ts`
- Modify: `janus-frontend/src/app/core/services/auth.service.ts`

**Step 1: Update User interface and DTOs**

In `user.model.ts`, replace:
```typescript
export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  active: boolean;
  customerId: number | null;
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: Role;
  customerId: number | null;
}

export interface UpdateUserRequest {
  fullName: string;
  email: string;
  role: Role;
  customerId: number | null;
  active: boolean;
  password: string | null;
}
```
With:
```typescript
export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  roles: string[];
  active: boolean;
  customerId: number | null;
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  roles: Role[];
  customerId: number | null;
}

export interface UpdateUserRequest {
  fullName: string;
  email: string;
  roles: Role[];
  customerId: number | null;
  active: boolean;
  password: string | null;
}
```

**Step 2: Update AuthService**

In `auth.service.ts`, replace:
```typescript
  role = computed(() => this.currentUser()?.role ?? null);
```
With:
```typescript
  roles = computed(() => this.currentUser()?.roles ?? []);
```

Replace `hasRole` method:
```typescript
  hasRole(roles: string[]): boolean {
    const userRole = this.role();
    return userRole !== null && roles.includes(userRole);
  }
```
With:
```typescript
  hasRole(roles: string[]): boolean {
    const userRoles = this.roles();
    return userRoles.length > 0 && userRoles.some(r => roles.includes(r));
  }
```

**Note:** The `hasRole` method signature stays the same — all 70+ template/component calls work unchanged.

---

## Task 8: Frontend — User Form (Multi-Select Roles)

**Files:**
- Modify: `janus-frontend/src/app/features/users/user-form/user-form.component.ts`

**Step 1: Change form control from single-select to multi-select**

In the form group, replace:
```typescript
    role: new FormControl('AGENT', { nonNullable: true, validators: [Validators.required] }),
```
With:
```typescript
    roles: new FormControl<string[]>(['AGENT'], { nonNullable: true, validators: [Validators.required] }),
```

**Step 2: Update template — replace single-select dropdown with checkboxes**

Replace the role `<select>` block (lines 46-53 of inline template):
```html
            <div class="col-md-6">
              <label class="form-label">{{ 'USERS.ROLE' | translate }} <span class="text-danger">*</span></label>
              <select class="form-select" formControlName="role">
                @for (r of roles; track r) {
                  <option [value]="r">{{ 'ROLES.' + r | translate }}</option>
                }
              </select>
            </div>
```
With:
```html
            <div class="col-md-6">
              <label class="form-label">{{ 'USERS.ROLES' | translate }} <span class="text-danger">*</span></label>
              <div class="d-flex flex-wrap gap-2">
                @for (r of availableRoles; track r) {
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" [id]="'role-' + r"
                      [checked]="isRoleSelected(r)" (change)="toggleRole(r)">
                    <label class="form-check-label" [for]="'role-' + r">{{ 'ROLES.' + r | translate }}</label>
                  </div>
                }
              </div>
              @if (form.get('roles')?.hasError('required') && form.get('roles')?.touched) {
                <div class="text-danger small mt-1">{{ 'VALIDATION.REQUIRED' | translate }}</div>
              }
            </div>
```

**Step 3: Update CUSTOMER conditional check**

Replace:
```html
            @if (form.get('role')?.value === 'CUSTOMER') {
```
With:
```html
            @if (isRoleSelected('CUSTOMER')) {
```

**Step 4: Rename `roles` property to `availableRoles` and add helper methods**

Replace:
```typescript
  roles = Object.values(Role);
```
With:
```typescript
  availableRoles = Object.values(Role);
```

Add these methods to the component class:
```typescript
  isRoleSelected(role: string): boolean {
    return this.form.get('roles')!.value.includes(role);
  }

  toggleRole(role: string): void {
    const current = this.form.get('roles')!.value;
    if (current.includes(role)) {
      const updated = current.filter((r: string) => r !== role);
      this.form.get('roles')!.setValue(updated);
    } else {
      this.form.get('roles')!.setValue([...current, role]);
    }
    this.form.get('roles')!.markAsTouched();
  }
```

**Step 5: Update patchValue in ngOnInit for edit mode**

Replace:
```typescript
          this.form.patchValue({
            username: u.username,
            fullName: u.fullName,
            email: u.email,
            role: u.role,
            customerId: u.customerId
          });
```
With:
```typescript
          this.form.patchValue({
            username: u.username,
            fullName: u.fullName,
            email: u.email,
            roles: u.roles,
            customerId: u.customerId
          });
```

**Step 6: Update onSubmit to use roles array**

Replace the update call:
```typescript
      this.userService.update(this.userId!, {
        fullName: val.fullName,
        email: val.email,
        role: val.role as Role,
        customerId: val.customerId,
        active: true,
        password: val.password || null
      }).subscribe(() => this.router.navigate(['/users']));
```
With:
```typescript
      this.userService.update(this.userId!, {
        fullName: val.fullName,
        email: val.email,
        roles: val.roles as Role[],
        customerId: val.customerId,
        active: true,
        password: val.password || null
      }).subscribe(() => this.router.navigate(['/users']));
```

Replace the create call:
```typescript
      this.userService.create({
        username: val.username,
        password: val.password,
        fullName: val.fullName,
        email: val.email,
        role: val.role as Role,
        customerId: val.customerId
      }).subscribe(() => this.router.navigate(['/users']));
```
With:
```typescript
      this.userService.create({
        username: val.username,
        password: val.password,
        fullName: val.fullName,
        email: val.email,
        roles: val.roles as Role[],
        customerId: val.customerId
      }).subscribe(() => this.router.navigate(['/users']));
```

---

## Task 9: Frontend — User List (Display Multiple Roles)

**Files:**
- Modify: `janus-frontend/src/app/features/users/user-list/user-list.component.ts`

**Step 1: Update role display in template**

Replace (line 40 of inline template):
```html
                <td><span class="badge bg-info text-dark">{{ 'ROLES.' + user.role | translate }}</span></td>
```
With:
```html
                <td>
                  @for (r of user.roles; track r) {
                    <span class="badge bg-info text-dark me-1">{{ 'ROLES.' + r | translate }}</span>
                  }
                </td>
```

---

## Task 10: Frontend — Clean hasRole Calls + i18n

**Files:**
- Modify: `janus-frontend/src/assets/i18n/en.json`
- Modify: `janus-frontend/src/assets/i18n/es.json`
- Multiple component files (hasRole cleanup)

**Step 1: Add i18n key for "Roles" (plural)**

In `en.json`, add under `USERS`:
```json
"ROLES": "Roles"
```

In `es.json`, add under `USERS`:
```json
"ROLES": "Roles"
```

**Step 2: Clean frontend hasRole calls — remove SUPERVISOR where AGENT is present**

Same logic as backend: since SUPERVISOR users have `[AGENT, SUPERVISOR]`, they match via AGENT. Remove SUPERVISOR from `hasRole` calls where AGENT is present.

**Keep SUPERVISOR only in these exclusive cases:**
- `sidebar.component.ts` line 66: `hasRole(['ADMIN', 'SUPERVISOR'])` — audit menu visibility
- `navbar.component.ts` line 52: `hasRole(['ADMIN', 'SUPERVISOR'])` — audit menu visibility
- `preliquidation.component.ts` line 159: `hasRole(['ADMIN', 'SUPERVISOR', 'CUSTOMER'])` — final approval
- `operation-detail.component.ts` line 178: `hasRole(['ADMIN', 'SUPERVISOR', 'CUSTOMER'])` — final approval
- `operation-detail.component.ts` line 474: `hasRole(['ADMIN', 'SUPERVISOR'])` — audit section
- `operation-detail.component.ts` line 651: `hasRole(['ADMIN', 'SUPERVISOR'])` — approval logic
- `payment-panel.component.ts` line 256: `hasRole(['ADMIN', 'SUPERVISOR'])` — approve button

**All other `hasRole(['ADMIN', 'SUPERVISOR', 'AGENT'])` calls become `hasRole(['ADMIN', 'AGENT'])`.**

Files to update (remove SUPERVISOR from hasRole where AGENT is present):
- `navbar.component.ts` lines 38, 45
- `sidebar.component.ts` line 41
- `charges-table.component.ts` lines 157, 163
- `customer-list.component.ts` lines 18, 48, 51
- `crossing-result.component.ts` lines 19, 69
- `declaration-list.component.ts` lines 20, 56
- `declaration-detail.component.ts` lines 68, 76
- `preliquidation.component.ts` lines 132, 186
- `dashboard.component.ts` line 101
- `dashboard.component.html` line 11
- `valuation-panel.component.ts` lines 258, 265
- `document-list.component.ts` lines 24, 54
- `operation-status.component.ts` line 22
- `operation-detail.component.ts` lines 64, 67, 73, 86, 121, 217, 313
- `inspection-panel.component.ts` lines 96, 162
- `operation-comments.component.ts` lines 18, 68
- `operation-list.component.ts` line 20
- `payment-panel.component.ts` lines 285, 460
- `alerts/operation-alerts.component.ts` line 38

**Step 3: Update test files**

Update auth service spec (`auth.service.spec.ts`) to test multi-role hasRole behavior:
- Test: user with roles `['AGENT', 'SUPERVISOR']` → `hasRole(['AGENT'])` returns true
- Test: user with roles `['AGENT', 'SUPERVISOR']` → `hasRole(['SUPERVISOR'])` returns true
- Test: user with roles `['AGENT']` → `hasRole(['SUPERVISOR'])` returns false

**Step 4: Build and verify**

Run: `cd janus-frontend && npx ng build`
Expected: Build succeeds with no errors

**Step 5: Commit**

```
feat: update frontend for multi-role permissions
```

---

## Task 11: Verification — End-to-End

**Step 1: Run backend tests**

Run: `cd janus-backend && ./gradlew test`
Expected: All tests pass

**Step 2: Run frontend build**

Run: `cd janus-frontend && npx ng build`
Expected: Build succeeds

**Step 3: Commit all remaining changes**

```
feat: implement multi-role permissions model
```

---

## Functional Testing

| Change | Affected Areas | Tests to Run |
|--------|---------------|--------------|
| User entity → multi-role | Login, all authenticated endpoints | Login as each seeded user, verify access |
| @RolesAllowed cleanup | All REST endpoints | Test SUPERVISOR can access AGENT endpoints via AGENT role |
| User form → multi-select | User create/edit screens | Create user with multiple roles, edit existing user |
| User list → badges | User list screen | Verify multiple role badges display correctly |
| hasRole() change | All role-gated UI elements | Verify navbar, sidebar, operation detail, declarations |
| DataSeeder + SUPERVISOR | Application startup | Verify supervisor user exists and can login |

**Critical test scenarios:**
1. Login as `supervisor` (roles: AGENT, SUPERVISOR) → verify access to all AGENT endpoints + audit log
2. Login as `agent` → verify NO access to audit log (SUPERVISOR-only)
3. Create new user with roles [AGENT, ACCOUNTING] → verify user can access both areas
4. Edit existing user → change roles → verify access changes immediately
5. Login as `admin` → verify all admin-only endpoints still work
6. Login as `client` → verify CUSTOMER isolation still works (customerId filter)
