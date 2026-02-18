# Task Routing Rules

This document defines when and how to delegate tasks using sub-agents (Task tool) and skills (Skill tool).

---

## Core Principle: Sub-Agents First

**Prefer spawning Task sub-agents** for any non-trivial work. The main context should act as an **orchestrator** — planning, coordinating, and verifying — not executing large blocks of code directly.

### When to use Sub-Agents (Task tool)
- Any task touching 3+ files
- Backend or frontend implementation work
- Bug investigation requiring exploration
- Infrastructure/DevOps tasks
- Parallel workstreams

### When to handle directly (no sub-agent)
- Trivial edits (< 3 files, obvious fix)
- Quick questions about the codebase
- Commit/PR creation
- Simple file reads or explanations

---

## Sub-Agent Definitions

### Backend Agent
**subagent_type**: `general-purpose`

**Trigger when user asks to:**
- Add/modify REST endpoints, services, entities, DTOs
- Fix backend bugs, database issues, query problems
- Add business logic, validation rules
- Configure Quarkus settings, dependencies
- Write or fix backend tests

**Prompt must include:**
```
You are working on janus-backend (Quarkus 3.27.2, Java 21, Gradle).
Package: com.janus. DTOs are Java records. Use Jakarta EE APIs (jakarta.*).
Conventions: see .claude/rules/backend.md

Task: [specific task description]

After implementation, run: cd janus-backend && ./gradlew test
Report: files changed, test results, any issues.
```

**Context to provide:**
- Relevant existing file paths (entities, services, resources involved)
- API contract if coordinating with frontend
- Business rules and validation requirements

---

### Frontend Agent
**subagent_type**: `general-purpose`

**Trigger when user asks to:**
- Create/modify Angular components, services, pipes, guards
- Add routing, navigation, i18n translations
- Fix frontend bugs, template issues
- Implement forms, tables, modals
- Update styling (non-design tasks)

**Prompt must include:**
```
You are working on janus-frontend (Angular 20, Bootstrap 5, TypeScript).
Use standalone components, signals, inject(). Follow existing patterns
in src/app/features/ and src/app/core/. i18n in src/assets/i18n/.
Conventions: see .claude/rules/frontend.md

Task: [specific task description]

After implementation, verify: cd janus-frontend && npx ng build
Report: files changed, build result, any issues.
```

**Context to provide:**
- API contract (endpoint URLs, request/response shapes)
- Reference components to follow patterns from
- i18n keys needed (both en.json and es.json)
- Role-based visibility requirements

---

### Infra Agent
**subagent_type**: `general-purpose`

**Trigger when user asks to:**
- Set up Docker, Docker Compose
- Configure CI/CD pipelines
- Manage deployment scripts
- Environment configuration
- Build tooling changes (Gradle, npm)

**Prompt must include:**
```
You are working on Janus infrastructure.
Backend: Quarkus (Dockerfile.jvm, Dockerfile.native). Gradle build.
Frontend: Angular CLI. Build output: dist/janus-frontend/.

Task: [specific task description]
```

---

### Explore Agent
**subagent_type**: `Explore`

**Trigger when:**
- Need to understand how a feature works across the codebase
- Investigating a bug (unknown root cause)
- Finding all usages of a pattern, entity, or endpoint
- Understanding data flow between layers
- Research before planning

**Use directly** — no special prompt template needed. Just describe what you're looking for.

---

## Cross-Layer Communication

When a feature spans both backend and frontend, follow these orchestration patterns.

### Pattern A: Full-Stack Feature (Sequential)

```
Step 1: PLAN
  → EnterPlanMode
  → Design API contract: endpoints, methods, DTOs, auth roles
  → Get user approval

Step 2: BACKEND (spawn Backend Agent)
  → Provide: endpoint specs, DTO fields, validation rules, business logic
  → Agent implements and runs tests
  → Agent reports: files created, endpoint URLs, DTO shapes, test results

Step 3: FRONTEND (spawn Frontend Agent)
  → Provide: confirmed API contract from Backend Agent results
  → Provide: UI requirements (components, routing, i18n, role guards)
  → Agent implements and verifies build
  → Agent reports: files created, build status

Step 4: VERIFY
  → Main context confirms both agents succeeded
  → Run integration check if needed
```

### Pattern B: Full-Stack Feature (Parallel)

Use when backend and frontend work are independent (API contract already known):

```
Step 1: Define API contract in main context

Step 2: Spawn BOTH agents in parallel (single message, two Task calls)
  → Backend Agent: implement endpoints + tests
  → Frontend Agent: implement UI + build verification

Step 3: Collect results from both, verify consistency
```

### Pattern C: Cross-Layer Bug Fix

```
Step 1: Spawn Explore Agent
  → "Find root cause of [bug description] across janus-backend and janus-frontend"

Step 2: Based on findings, spawn appropriate agent(s)
  → If backend issue: Backend Agent with fix instructions
  → If frontend issue: Frontend Agent with fix instructions
  → If both: Sequential — fix backend first, then frontend

Step 3: Verify fix with tests
```

### API Contract Format

When communicating API details between agents, use this structure:

```
Endpoint: [METHOD] /api/[resource]
Path Params: id (Long)
Request Body: { field: type (constraints), ... }
Response Body: { field: type, ... }
Auth: @RolesAllowed(["ADMIN", "AGENT"])
Status Codes: 200 OK, 201 Created, 404 Not Found
```

---

## Skill Routing

Skills are invoked via the **Skill tool** for specialized knowledge. Skills differ from sub-agents: they inject expert knowledge into the current context rather than spawning an autonomous worker.

### Development Skills

#### frontend-design
**Trigger when user asks to:**
- "Build a web component/page/app"
- "Create a UI for..."
- "Design frontend for..."
- "Make this look better"
- "Create a dashboard/interface"

**Capabilities:** Production-grade frontend design with high visual quality. Avoids generic AI aesthetics. Use when **aesthetic quality matters**, not just functionality.

**Note:** For functional Angular work (add a table, fix a form), use a Frontend Agent instead.

#### playground
**Trigger when user asks to:**
- "Create a playground for..."
- "Make an interactive tool/explorer"
- "Build a visual configurator"
- "Create a demo with live preview"

**Capabilities:** Self-contained single-file HTML tools with interactive controls and live preview.

#### stripe-best-practices
**Trigger when implementing:**
- Payment processing, checkout flows, subscriptions
- Stripe webhooks, Stripe Connect
- Any Stripe API integration

**Capabilities:** Best practices for Stripe integrations, security patterns, webhook handling.

---

### Claude Code Configuration Skills

#### claude-automation-recommender
**Trigger:** "What automations should I set up?", "Optimize my Claude Code setup", "What hooks/skills/plugins should I use?"

**Capabilities:** Analyzes codebase and recommends Claude Code automations. Read-only.

#### claude-md-improver
**Trigger:** "Check/audit CLAUDE.md", "Improve CLAUDE.md", "Fix CLAUDE.md"

**Capabilities:** Scans, evaluates, and improves CLAUDE.md files.

#### writing-hookify-rules
**Trigger:** "Create a hookify rule", "Configure hookify"

**Capabilities:** Hookify rule syntax, patterns, configuration.

---

### Plugin Development Skills

| Skill | Trigger | Capabilities |
|-------|---------|--------------|
| `plugin-structure` | "Create/scaffold a plugin" | Plugin layout, manifest, organization |
| `command-development` | "Create a slash command" | YAML frontmatter, arguments, bash execution |
| `skill-development` | "Create a skill" | SKILL.md, progressive disclosure patterns |
| `agent-development` | "Create an agent" | Agent frontmatter, system prompts, triggers |
| `hook-development` | "Create a hook" | PreToolUse/PostToolUse/Stop events |
| `mcp-integration` | "Add MCP server" | .mcp.json, stdio/SSE/HTTP server config |
| `plugin-settings` | "Plugin settings" | .local.md files, YAML frontmatter settings |

---

## Routing Decision Examples

```
User: "Add a new REST endpoint for reports"
→ Spawn Backend Agent

User: "Create a reports page with filters and table"
→ Spawn Frontend Agent

User: "Add a reports feature end-to-end"
→ Orchestrate: Plan → Backend Agent (API) → Frontend Agent (UI)

User: "Add a reports feature, I already know the API contract"
→ Parallel: Backend Agent + Frontend Agent simultaneously

User: "Make the dashboard look better"
→ Skill: frontend-design

User: "Fix the bug where operations don't save"
→ Explore Agent (find cause) → Backend or Frontend Agent (fix)

User: "How does the compliance validation work?"
→ Explore Agent

User: "Set up Docker Compose for dev"
→ Spawn Infra Agent

User: "Review this PR"
→ Handle directly (main context)

User: "Fix typo in translation file"
→ Handle directly (trivial)

User: "Create a slash command to run tests"
→ Skill: command-development

User: "What Claude Code automations should I use?"
→ Skill: claude-automation-recommender
```

---

## Summary

| Layer | Tool | Type | When |
|-------|------|------|------|
| Backend | Task | `general-purpose` | Java/Quarkus implementation |
| Frontend | Task | `general-purpose` | Angular implementation |
| Infra | Task | `general-purpose` | Docker, CI/CD, deployment |
| Explore | Task | `Explore` | Codebase research, bug investigation |
| Plan | EnterPlanMode | — | Complex features needing design |
| Skills | Skill | — | Specialized knowledge (design, Stripe, plugins) |
| Direct | — | — | Trivial tasks, commits, explanations |
