# Janus Project - Claude Code Configuration

## Project Overview

**Janus** (named after the Roman god of beginnings, endings, transitions, and portals) is a dual-facing application.

### Current Structure
- **janus-backend/** - Quarkus-based Java REST API (backend project)
- **janus-frontend/** - Angular 20 + Bootstrap web application (frontend project) *(planned)*
- **requerimientos/** - Requirements and user stories

### Tech Stack
- **Backend**: Java 21, Quarkus 3.27.2, Gradle
- **Frontend**: Angular 20, Bootstrap, TypeScript *(planned)*
- **Purpose**: (Defined in requirements documentation)

## Quick Reference

### Backend (janus-backend)
- **Language**: Java 21
- **Framework**: Quarkus 3.27.2
- **Build Tool**: Gradle
- **Dev Command**: `cd janus-backend && ./gradlew quarkusDev`
- **Dev UI**: http://localhost:8080/q/dev/
- **Test Command**: `./gradlew test`

### Frontend (janus-frontend) *(planned)*
- **Language**: TypeScript
- **Framework**: Angular 20
- **Styling**: Bootstrap
- **Dev Command**: `cd janus-frontend && ng serve`
- **Dev URL**: http://localhost:4200
- **Test Command**: `ng test`

### Documentation
- **Requirements**: `requerimientos/` directory
- **Backend Details**: `.claude/rules/backend.md`
- **Frontend Details**: `.claude/rules/frontend.md`

## Skill Routing Rules

When working on this project, delegate tasks to specialized skills based on the user's request:

### Automation & Setup
- **Automation recommendations** → Use `claude-automation-recommender` skill
- **Improving CLAUDE.md** → Use `claude-md-improver` skill
- **Setting up hooks** → Use `writing-hookify-rules` skill

### Development Tasks
- **Building web interfaces/frontend** → Use `frontend-design` skill
- **Creating interactive tools** → Use `playground` skill
- **Stripe payment integration** → Use `stripe-best-practices` skill

### Plugin Development
- **Creating/modifying plugins** → Use `plugin-structure` skill
- **Adding slash commands** → Use `command-development` skill
- **Creating skills** → Use `skill-development` skill
- **Adding agents** → Use `agent-development` skill
- **Creating hooks** → Use `hook-development` skill
- **Integrating MCP servers** → Use `mcp-integration` skill
- **Plugin settings/config** → Use `plugin-settings` skill

For detailed routing rules and guidelines, see `.claude/rules/`.

## Additional Configuration

Detailed project rules are organized in `.claude/rules/`:
- `skill-routing.md` - Complete skill delegation rules
- `development-guidelines.md` - Coding standards and practices
- `project-context.md` - Janus-specific context and architecture
- `backend.md` - Backend-specific guidelines (janus-backend)
- `frontend.md` - Frontend-specific guidelines (janus-frontend)
- `guidelines.md` - General development guidelines

---

*This CLAUDE.md provides high-level guidance. For detailed rules, consult `.claude/rules/`.*
