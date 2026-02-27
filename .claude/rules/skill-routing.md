# Task Routing Reference

> Authoritative routing rules are in **CLAUDE.md**. This file provides quick-reference details.

---

## Sub-Agent Prompt Templates

### Backend Agent (`general-purpose`)

```
You are working on janus-backend (Quarkus 3.27.2, Java 21, Gradle).
Package: com.janus. DTOs are Java records. Use Jakarta EE APIs (jakarta.*).
Conventions: see .claude/rules/backend.md

Task: [specific task description]

Context: [file paths, business rules, API contract]

After implementation, run: cd janus-backend && ./gradlew test
Report: files changed, test results, any issues.
```

### Frontend Agent (`general-purpose`)

```
You are working on janus-frontend (Angular 20, Bootstrap 5, TypeScript).
Standalone components, signals, inject(). Patterns in src/app/features/ and src/app/core/.
i18n in src/assets/i18n/ (both en.json and es.json). Errors use ERRORS.{errorCode} keys.
Conventions: see .claude/rules/frontend.md

Task: [specific task description]

Context: [API contract, reference components, role visibility, i18n keys]

After implementation, verify: cd janus-frontend && npx ng build
Report: files changed, build result, any issues.
```

### Infra Agent (`general-purpose`)

```
You are working on Janus infrastructure.
Backend: Quarkus (Dockerfile.jvm, Dockerfile.native). Gradle build.
Frontend: Angular CLI. Build output: dist/janus-frontend/.

Task: [specific task description]
```

### Explore Agent (`Explore`)

No template needed. Describe what you're looking for.

---

## API Contract Format

Used for all cross-layer agent communication:

```
Endpoint: [METHOD] /api/[resource]
Path Params: id (Long)
Query Params: status (String, optional)
Request Body: { field: type (constraints), ... }
Response Body: { field: type, ... }
Error Response: { error: String, errorCode: String }
Auth: @RolesAllowed(["ADMIN", "AGENT"])
Status Codes: 200 OK, 201 Created, 400 Bad Request, 404 Not Found
```

---

## i18n Conventions

When any agent adds user-facing text:

| Pattern | Example | Usage |
|---------|---------|-------|
| `ERRORS.{errorCode}` | `ERRORS.DECLARATION_ALREADY_EXISTS` | Backend BusinessException error codes |
| `STATUS.{STATUS_NAME}` | `STATUS.DECLARATION_IN_PROGRESS` | Operation status labels |
| `COMPLIANCE.{RULE_CODE}` | `COMPLIANCE.BL_NOT_VALIDATED` | Compliance rule error messages |
| `FEATURE.KEY` | `DECLARATIONS.DETAIL_TITLE` | Feature-specific UI labels |

Always update **both** `en.json` and `es.json`.

---

## Permission Model

| Role | Access Level |
|------|-------------|
| ADMIN | Full access, can delete DRAFT operations |
| AGENT | Full operational access, cannot delete |
| ACCOUNTING | Read-only (operations, history, documents, completeness) |
| CLIENT | Read-only, can approve final declarations for own operations |
| CARRIER | Transport info only |
