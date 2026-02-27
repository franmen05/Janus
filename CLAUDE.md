# Janus Project - Claude Code Configuration

## Project Overview

**Janus** — dual-facing customs management application.

- **janus-backend/** — Quarkus 3.27.2 REST API (Java 21, Gradle)
- **janus-frontend/** — Angular 20 + Bootstrap 5 (TypeScript)
- **requerimientos/** — Requirements and user stories

| Area | Dev | Test | URL |
|------|-----|------|-----|
| Backend | `cd janus-backend && ./gradlew quarkusDev` | `./gradlew test` | http://localhost:8080 |
| Frontend | `cd janus-frontend && ng serve` | `ng test` | http://localhost:4200 |

---

## Core Principle: Sub-Agents Only

The main context is an **orchestrator** — it plans, delegates, and verifies. It **never** writes implementation code directly.

**Main context responsibilities:**
- Route user requests to the correct agent or skill
- Plan cross-layer features (EnterPlanMode)
- Pass API contracts between agents
- Verify agent results (tests pass, build succeeds)
- Create commits and PRs
- Answer quick questions about the codebase

**Everything else goes to a sub-agent.**

---

## Routing Decision Tree

```
User Request
    │
    ├─ Spans backend + frontend?
    │   └─ Orchestrate (see §Cross-Layer Protocols)
    │
    ├─ Backend work (Java, Quarkus, API, DB, tests)?
    │   └─ Backend Agent
    │
    ├─ Frontend work (Angular, components, i18n, routing)?
    │   └─ Frontend Agent
    │
    ├─ UI/UX design, visual polish, aesthetics?
    │   └─ Skill: frontend-design
    │
    ├─ Infrastructure (Docker, CI/CD, deployment, build)?
    │   └─ Infra Agent
    │
    ├─ Bug with unknown root cause?
    │   └─ Explore Agent → then fix agent(s)
    │
    ├─ Codebase exploration / understanding?
    │   └─ Explore Agent
    │
    ├─ Complex feature needing design?
    │   └─ EnterPlanMode → then spawn agents
    │
    ├─ Matches a Skill trigger? (see §Skills)
    │   └─ Skill tool
    │
    └─ Commit, PR, quick question?
        └─ Main context (only exception)
```

---

## Sub-Agent Definitions

### Backend Agent
**Type:** `general-purpose`

**When:** REST endpoints, services, entities, DTOs, business logic, validation, DB config, backend tests, compliance rules.

**Prompt template:**
```
You are working on janus-backend (Quarkus 3.27.2, Java 21, Gradle).
Package: com.janus. DTOs are Java records. Use Jakarta EE APIs (jakarta.*).
Conventions: see .claude/rules/backend.md

Task: [describe task]

Context: [relevant file paths, business rules, API contract if cross-layer]

After implementation, run: cd janus-backend && ./gradlew test
Report: files changed, test results, any issues.
```

### Frontend Agent
**Type:** `general-purpose`

**When:** Components, services, pipes, guards, routing, i18n, forms, tables, modals, styling (functional, not design).

**Prompt template:**
```
You are working on janus-frontend (Angular 20, Bootstrap 5, TypeScript).
Standalone components, signals, inject(). Patterns in src/app/features/ and src/app/core/.
i18n in src/assets/i18n/ (both en.json and es.json). Errors use ERRORS.{errorCode} keys.
Conventions: see .claude/rules/frontend.md

Task: [describe task]

Context: [API contract, reference components, role-based visibility, i18n keys needed]

After implementation, verify: cd janus-frontend && npx ng build
Report: files changed, build result, any issues.
```

### Infra Agent
**Type:** `general-purpose`

**When:** Docker, Docker Compose, CI/CD pipelines, deployment scripts, environment config, Gradle/npm build tooling.

**Prompt template:**
```
You are working on Janus infrastructure.
Backend: Quarkus (Dockerfile.jvm, Dockerfile.native). Gradle build.
Frontend: Angular CLI. Build output: dist/janus-frontend/.

Task: [describe task]
```

### Explore Agent
**Type:** `Explore`

**When:** Understanding features, investigating bugs, finding usages, tracing data flow, research before planning.

No special template — describe what you're looking for.

---

## Cross-Layer Protocols

When a feature spans backend + frontend, the main context orchestrates agent communication using **API contracts**.

### API Contract Format

All cross-layer communication uses this structure:
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

### Protocol A: Full-Stack Feature (Sequential)

Use when the frontend depends on backend decisions (new endpoints, new DTOs).

```
1. PLAN → EnterPlanMode → design API contract → get user approval

2. BACKEND AGENT → provide:
   - Endpoint specs (method, path, DTOs, validation)
   - Business logic requirements
   - Auth roles
   - "Run tests and report: endpoint URLs, DTO shapes, test results"

3. COLLECT → extract confirmed API contract from backend results

4. FRONTEND AGENT → provide:
   - Confirmed API contract from step 3 (exact URLs, DTO shapes, error codes)
   - UI requirements (components, routing, i18n keys in en+es)
   - Role-based visibility rules
   - "Verify build and report: files created, build status"

5. VERIFY → confirm both agents succeeded
```

### Protocol B: Full-Stack Feature (Parallel)

Use when the API contract is already known or unchanged.

```
1. Define API contract in main context

2. Spawn BOTH in a single message (two Task calls):
   - Backend Agent → implement endpoints + tests
   - Frontend Agent → implement UI + build

3. Collect results, verify consistency
```

### Protocol C: Cross-Layer Bug Fix

```
1. EXPLORE AGENT → "Find root cause of [bug] across janus-backend and janus-frontend"

2. Based on findings:
   - Backend issue → Backend Agent
   - Frontend issue → Frontend Agent
   - Both → Sequential: backend first (API fix), then frontend

3. Verify: ./gradlew test + npx ng build
```

### Protocol D: i18n Changes

Any feature that adds user-facing text must include i18n:

```
Frontend Agent prompt must include:
- "Add i18n keys to BOTH en.json and es.json"
- "Error messages use ERRORS.{errorCode} pattern"
- "Status labels use STATUS.{STATUS_NAME} pattern"
- "Compliance messages use COMPLIANCE.{RULE_CODE} pattern"
```

### Protocol E: Infra + App Coordination

When infra changes affect app configuration:

```
1. INFRA AGENT → implement infra changes, report:
   - New environment variables needed
   - Port/URL changes
   - New build steps

2. BACKEND/FRONTEND AGENT → update app config:
   - application.properties for new env vars
   - environment.ts for URL changes
   - angular.json / build.gradle for build changes
```

---

## Skill Routing

Skills inject expert knowledge into the current context (unlike agents that work autonomously).

### Project Development Skills

| Skill | Trigger | Use When |
|-------|---------|----------|
| `frontend-design` | "Make it look better", "Design a UI", "Visual polish" | Aesthetic quality matters — layouts, design systems, visual identity |
| `playground` | "Create a playground", "Interactive tool", "Live preview" | Self-contained HTML demos, configurators, explorers |
| `stripe-best-practices` | Payment processing, Stripe API, subscriptions | Any Stripe integration work |

**Note:** `frontend-design` is for **aesthetics**. For functional Angular work (add a table, fix a form, wire an API), use the **Frontend Agent** instead.

### Claude Code Configuration Skills

| Skill | Trigger | Use When |
|-------|---------|----------|
| `claude-automation-recommender` | "Optimize my setup", "What automations?" | Recommend hooks, skills, plugins, MCP servers |
| `claude-md-improver` | "Improve CLAUDE.md", "Audit CLAUDE.md" | Scan and improve project documentation |
| `writing-hookify-rules` | "Create a hookify rule", "Configure hookify" | Hookify rule syntax and patterns |

### Plugin Development Skills

| Skill | Trigger |
|-------|---------|
| `plugin-structure` | "Create/scaffold a plugin" |
| `command-development` | "Create a slash command" |
| `skill-development` | "Create a skill" |
| `agent-development` | "Create an agent" |
| `hook-development` | "Create a hook" |
| `mcp-integration` | "Add MCP server" |
| `plugin-settings` | "Plugin settings/config" |

---

## Routing Examples

```
"Add a REST endpoint for reports"           → Backend Agent
"Create a reports page with filters"        → Frontend Agent
"Add reports feature end-to-end"            → Protocol A: Plan → Backend → Frontend
"Reports feature, API contract is X"        → Protocol B: Backend + Frontend in parallel
"Make the dashboard look better"            → Skill: frontend-design
"Fix bug where operations don't save"       → Protocol C: Explore → fix agent(s)
"Set up Docker Compose"                     → Infra Agent
"Add env var for email service"             → Protocol E: Infra → Backend config
"Add i18n for new error messages"           → Frontend Agent (with Protocol D context)
"Optimize my Claude Code setup"             → Skill: claude-automation-recommender
"Create a slash command for tests"          → Skill: command-development
"Fix typo in translation"                   → Main context (trivial)
"Commit these changes"                      → Main context
```

---

## Rules Files

| File | Content |
|------|---------|
| `.claude/rules/backend.md` | Java/Quarkus conventions, package structure, commands |
| `.claude/rules/frontend.md` | Angular conventions, component patterns, commands |
| `.claude/rules/development-guidelines.md` | Code quality, git workflow, testing standards |
| `.claude/rules/project-context.md` | Architecture overview, dev environment setup |
| `.claude/rules/guidelines.md` | General editing rules (read first, minimize changes, test) |
