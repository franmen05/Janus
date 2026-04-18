# Multi-Role Permissions Design

## Context

Currently each user in Janus has a single role (`String role` field on User entity). This forces duplication in `@RolesAllowed` annotations — for example, SUPERVISOR must be explicitly added to every endpoint where AGENT has access (~25 endpoints). The new model allows assigning multiple roles per user, so a SUPERVISOR gets roles `[AGENT, SUPERVISOR]` and inherits AGENT access automatically.

## Problem

- SUPERVISOR has all AGENT permissions + audit log + final declaration approval
- With single-role model, SUPERVISOR must be added to every `@RolesAllowed` where AGENT appears
- 102 `@RolesAllowed` annotations exist, ~25 have SUPERVISOR+AGENT duplicated
- Role enum in backend is missing SUPERVISOR (only frontend has it)
- No SUPERVISOR seed user exists in DataSeeder

## Solution: `@ElementCollection` Multi-Role

Quarkus Security JPA natively supports `@ElementCollection` with `@Roles`. No custom security augmentor needed.

### Database Change

New table `user_roles`:
```sql
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id),
    role VARCHAR(50) NOT NULL
);
```

Remove `role` column from `users` table (Hibernate handles this automatically with schema update strategy).

### Backend Entity Change

**User.java** — replace:
```java
@Roles
@Column(nullable = false)
public String role;
```

With:
```java
@Roles
@ElementCollection(fetch = FetchType.EAGER)
@CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
@Column(name = "role")
public Set<String> roles = new HashSet<>();
```

`FetchType.EAGER` is required — Quarkus reads roles during authentication outside transaction context.

### Role Enum Fix

Add `SUPERVISOR` to `Role.java`:
```java
public enum Role {
    ADMIN,
    SUPERVISOR,
    AGENT,
    ACCOUNTING,
    CUSTOMER,
    CARRIER
}
```

### @RolesAllowed Cleanup

Remove SUPERVISOR from endpoints where AGENT already has access. A SUPERVISOR user with roles `[AGENT, SUPERVISOR]` accesses these via AGENT role.

**Before:** `@RolesAllowed({"SUPERVISOR", "ADMIN", "AGENT"})`
**After:** `@RolesAllowed({"ADMIN", "AGENT"})`

Keep SUPERVISOR only on exclusive endpoints:
- Audit log access
- Final declaration approval
- Any future SUPERVISOR-only features

### DTO Changes

**UserResponse/UserDTO**: `String role` → `List<String> roles`
**UserMapper**: Map `Set<String>` ↔ `List<String>`

### SecurityHelper Changes

Update CUSTOMER check from `"CUSTOMER".equals(user.role)` to `user.roles.contains("CUSTOMER")`.

### Seed Data (DataSeeder)

Add SUPERVISOR user with roles `[AGENT, SUPERVISOR]`:
```java
createUser("supervisor", "super123", "Supervisor User", "supervisor@janus.com", 
    Set.of(Role.AGENT, Role.SUPERVISOR), null);
```

### Frontend Changes

**user.model.ts**: `role: string` → `roles: string[]`

**auth.service.ts**: 
```typescript
role = computed(() => this.currentUser()?.roles ?? []);

hasRole(roles: string[]): boolean {
    const userRoles = this.role();
    return userRoles.some(r => roles.includes(r));
}
```

**user-form.component**: Single-select dropdown → multi-select checkboxes/chips for role selection.

**Templates**: Existing `hasRole(['ADMIN', 'AGENT'])` calls work unchanged — the method signature stays the same, only internal logic changes.

## Files to Modify

### Backend
| File | Change |
|------|--------|
| `user/domain/model/User.java` | `String role` → `Set<String> roles` with `@ElementCollection` |
| `user/domain/model/Role.java` | Add `SUPERVISOR` to enum |
| `user/dto/UserResponse.java` | `String role` → `List<String> roles` |
| `user/dto/CreateUserRequest.java` | `String role` → `List<String> roles` |
| `user/dto/UpdateUserRequest.java` | `String role` → `List<String> roles` |
| `user/mapper/UserMapper.java` | Map set ↔ list |
| `user/service/UserService.java` | Handle multiple roles in create/update |
| `user/resource/UserResource.java` | Adjust role validation |
| `config/SecurityHelper.java` | `.equals()` → `.contains()` for CUSTOMER check |
| `config/DataSeeder.java` | Multi-role seed data, add SUPERVISOR user |
| `import.sql` | Update seed data format |
| 25+ Resource files | Clean `@RolesAllowed` — remove SUPERVISOR where AGENT present |

### Frontend
| File | Change |
|------|--------|
| `core/models/user.model.ts` | `role: string` → `roles: string[]` |
| `core/services/auth.service.ts` | `hasRole()` checks against roles array |
| `features/users/user-form/user-form.component.ts` | Multi-select for roles |
| `features/users/user-form/user-form.component.html` | Checkboxes/chips UI |
| `features/users/user-list/user-list.component.html` | Display multiple roles |

## Role Assignment Examples

| User | Roles | Access |
|------|-------|--------|
| admin | `[ADMIN]` | Full admin access |
| supervisor | `[AGENT, SUPERVISOR]` | All AGENT endpoints + audit + approval |
| agent | `[AGENT]` | Operational endpoints |
| accounting | `[ACCOUNTING]` | Read-only financial |
| client | `[CUSTOMER]` | Own operations only |
| carrier | `[CARRIER]` | Transport info only |
