# Janus Project - Claude Code Configuration

## Project Overview

**Janus** (named after the Roman god of beginnings, endings, transitions, and portals) is a dual-facing customs management application.

### Current Structure
- **janus-backend/** - Quarkus 3.27.2 REST API (Java 21, Gradle)
- **janus-frontend/** - Angular 20 + Bootstrap web application (TypeScript)
- **requerimientos/** - Requirements and user stories

## Quick Reference

| Area | Dev Command | Test Command | URL |
|------|------------|--------------|-----|
| Backend | `cd janus-backend && ./gradlew quarkusDev` | `./gradlew test` | http://localhost:8080 |
| Frontend | `cd janus-frontend && ng serve` | `ng test` | http://localhost:4200 |

### Documentation
- **Requirements**: `requerimientos/`
- **Backend conventions**: `.claude/rules/backend.md`
- **Frontend conventions**: `.claude/rules/frontend.md`
- **Dev guidelines**: `.claude/rules/development-guidelines.md`

---

## Sub-Agent Routing (Preferred Strategy)

**Always prefer spawning Task sub-agents** over handling everything in the main context. This keeps the main context clean and allows parallel work.

### Decision Flow

```
User Request
    │
    ├── Feature / bug involving BOTH backend + frontend?
    │     └── Orchestrate: spawn Backend Agent + Frontend Agent (see §Cross-Layer)
    │
    ├── Backend-only work (Java, Quarkus, API, DB)?
    │     └── Spawn: Backend Agent (subagent_type=general-purpose)
    │
    ├── Frontend-only work (Angular, UI, components)?
    │     └── Spawn: Frontend Agent (subagent_type=general-purpose)
    │
    ├── UI/UX design, visual polish, styling?
    │     └── Use Skill: frontend-design
    │
    ├── Infrastructure (Docker, CI/CD, deployment)?
    │     └── Spawn: Infra Agent (subagent_type=general-purpose)
    │
    ├── Code exploration / understanding?
    │     └── Spawn: Explore Agent (subagent_type=Explore)
    │
    ├── Planning a complex feature?
    │     └── Use: EnterPlanMode → then spawn agents to implement
    │
    ├── Matches a Skill trigger? (see §Skills below)
    │     └── Use: Skill tool
    │
    └── Simple/trivial task (< 3 files, obvious fix)?
          └── Handle directly in main context
```

### Backend Agent

**When**: Java/Quarkus work — endpoints, services, entities, DTOs, tests, DB config

**Prompt template**:
```
You are working on janus-backend (Quarkus 3.27.2, Java 21, Gradle).
Package: com.janus. DTOs are Java records. Use Jakarta EE APIs.
See .claude/rules/backend.md for conventions.

Task: [describe task]

After implementation, run: cd janus-backend && ./gradlew test
Report results back.
```

### Frontend Agent

**When**: Angular/TypeScript work — components, services, routing, i18n, templates

**Prompt template**:
```
You are working on janus-frontend (Angular 20, Bootstrap 5, TypeScript).
Use standalone components, signals, inject(). Follow existing patterns
in src/app/features/ and src/app/core/. i18n in src/assets/i18n/.
See .claude/rules/frontend.md for conventions.

Task: [describe task]

After implementation, verify: cd janus-frontend && npx ng build
Report results back.
```

### Infra Agent

**When**: Docker, CI/CD, deployment, environment config, build tooling

**Prompt template**:
```
You are working on Janus infrastructure.
Backend: Quarkus (Dockerfile.jvm, Dockerfile.native). Gradle build.
Frontend: Angular CLI. Output: dist/janus-frontend/.

Task: [describe task]
```

---

## Cross-Layer Communication Protocol

When a feature spans backend + frontend, the main agent acts as **orchestrator**:

### Pattern: Full-Stack Feature

```
1. PLAN    → Use EnterPlanMode to design API contract (endpoints, DTOs, responses)
2. BACKEND → Spawn Backend Agent with:
             - Endpoint paths, HTTP methods, request/response DTOs
             - Validation rules, business logic
             - "Run tests and report results"
3. WAIT    → Collect Backend Agent results (endpoints created, test status)
4. FRONTEND → Spawn Frontend Agent with:
              - API contract from step 2 (exact URLs, DTO shapes)
              - UI requirements (which components, where in routing)
              - i18n keys needed
              - "Verify build compiles"
5. VERIFY  → Check both agents succeeded, run final integration check
```

### Pattern: Bug Fix Spanning Layers

```
1. EXPLORE → Spawn Explore Agent to find root cause across both layers
2. FIX     → Spawn the appropriate agent(s) based on findings
3. TEST    → Backend: ./gradlew test | Frontend: npx ng build
```

### API Contract Format (for agent communication)

When passing API details between agents, use this format:
```
Endpoint: [METHOD] /api/[resource]
Request DTO: { field: type, ... }
Response DTO: { field: type, ... }
Auth: @RolesAllowed([roles])
```

---

## Skill Routing

Skills are invoked via the Skill tool for specialized knowledge domains.

### Project Development Skills

| Trigger | Skill | Use When |
|---------|-------|----------|
| UI design, visual polish | `frontend-design` | Aesthetic quality matters — layouts, styling, design systems |
| Interactive demos | `playground` | Self-contained HTML tools, configurators, live previews |
| Stripe payments | `stripe-best-practices` | Any payment/checkout/subscription integration |

### Claude Code Configuration Skills

| Trigger | Skill | Use When |
|---------|-------|----------|
| "Optimize my setup" | `claude-automation-recommender` | Recommending hooks, skills, plugins, MCP servers |
| "Improve CLAUDE.md" | `claude-md-improver` | Auditing and improving CLAUDE.md files |
| "Create hook rules" | `writing-hookify-rules` | Hookify rule syntax and configuration |

### Plugin Development Skills

| Trigger | Skill | Use When |
|---------|-------|----------|
| Create/scaffold plugin | `plugin-structure` | Plugin layout, manifest, organization |
| Slash commands | `command-development` | YAML frontmatter, arguments, bash execution |
| Create skills | `skill-development` | SKILL.md, progressive disclosure |
| Create agents | `agent-development` | Agent frontmatter, system prompts, triggers |
| Create hooks | `hook-development` | PreToolUse, PostToolUse, Stop events |
| MCP servers | `mcp-integration` | .mcp.json, stdio/SSE/HTTP servers |
| Plugin config | `plugin-settings` | .local.md files, YAML frontmatter settings |

---

## Routing Examples

```
User: "Add a new REST endpoint for reports"
→ Spawn Backend Agent

User: "Create a reports page with filters and table"
→ Spawn Frontend Agent

User: "Add a reports feature end-to-end"
→ Orchestrate: Plan → Backend Agent (API) → Frontend Agent (UI)

User: "Make the dashboard look better"
→ Skill: frontend-design

User: "Fix the bug where operations don't save"
→ Explore Agent (find cause) → Backend or Frontend Agent (fix)

User: "Set up Docker Compose for dev"
→ Spawn Infra Agent

User: "Review this PR"
→ Handle directly (simple review in main context)

User: "Fix typo in translation file"
→ Handle directly (trivial)
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
