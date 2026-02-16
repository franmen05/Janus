# Skill Routing Rules

This document defines when to delegate tasks to specialized Claude Code skills based on user requests.

## Automation & Configuration Skills

### claude-automation-recommender
**Trigger when user asks about:**
- "What automations should I set up?"
- "How do I optimize my Claude Code setup?"
- "Recommend Claude Code features for this project"
- "How should I configure Claude Code for this codebase?"
- "What hooks/skills/plugins should I use?"

**Capabilities:**
- Analyzes codebase structure
- Recommends hooks, subagents, skills, plugins, MCP servers
- Provides setup guidance for Claude Code features
- Read-only analysis (no file modifications)

### claude-md-improver
**Trigger when user asks to:**
- "Check/audit CLAUDE.md"
- "Improve CLAUDE.md"
- "Fix/update CLAUDE.md"
- "Review project documentation"

**Capabilities:**
- Scans for all CLAUDE.md files
- Evaluates quality against best practice templates
- Outputs quality report
- Makes targeted improvements

### writing-hookify-rules
**Trigger when user asks to:**
- "Create a hookify rule"
- "Write a hook rule"
- "Configure hookify"
- "Add hookify automation"

**Capabilities:**
- Guidance on hookify rule syntax
- Pattern recommendations
- Hook configuration best practices

---

## Development & Design Skills

### frontend-design
**Trigger when user asks to:**
- "Build a web component/page/app"
- "Create a UI for..."
- "Design frontend for..."
- "Make this look better"
- "Create a dashboard/interface"

**Capabilities:**
- Creates distinctive, production-grade frontend code
- High design quality (avoids generic AI aesthetics)
- Modern web component development
- Visual polish and creative interfaces

**Important:** Use when aesthetic/design quality matters

### playground
**Trigger when user asks to:**
- "Create a playground for..."
- "Make an interactive tool/explorer"
- "Build a visual configurator"
- "Create a demo with live preview"

**Capabilities:**
- Self-contained single-file HTML explorers
- Interactive controls + live preview
- Copy-paste prompt generation
- Visual configuration interfaces

---

## Domain-Specific Skills

### stripe-best-practices
**Trigger when implementing:**
- Payment processing
- Checkout flows
- Subscription systems
- Stripe webhooks
- Stripe Connect platforms
- Any Stripe API integration

**Capabilities:**
- Best practices for Stripe integrations
- Security patterns
- Webhook handling
- Error recovery strategies

---

## Plugin Development Skills

### plugin-structure
**Trigger when user asks to:**
- "Create a plugin"
- "Scaffold a plugin"
- "Understand plugin structure"
- "Organize plugin components"

**Capabilities:**
- Plugin directory layout guidance
- Manifest configuration
- Plugin architecture patterns
- Component organization

### command-development
**Trigger when user asks to:**
- "Create a slash command"
- "Add a command"
- "Write a custom /command"

**Capabilities:**
- Slash command structure
- YAML frontmatter configuration
- Dynamic arguments
- Bash execution patterns
- Command best practices

### skill-development
**Trigger when user asks to:**
- "Create a skill"
- "Add a skill to plugin"
- "Write a new skill"

**Capabilities:**
- Skill structure and organization
- Progressive disclosure patterns
- SKILL.md formatting
- Skill development best practices

### agent-development
**Trigger when user asks to:**
- "Create an agent"
- "Add a subagent"
- "Write an agent for..."

**Capabilities:**
- Agent structure and frontmatter
- System prompt design
- Triggering conditions
- Agent development patterns

### hook-development
**Trigger when user asks to:**
- "Create a hook"
- "Add a PreToolUse/PostToolUse hook"
- "Validate tool usage"
- "Add automation on Stop event"

**Capabilities:**
- Event-driven automation scripts
- Prompt-based hooks
- Tool validation patterns
- Hook lifecycle management

### mcp-integration
**Trigger when user asks to:**
- "Add MCP server"
- "Integrate MCP"
- "Configure MCP in plugin"
- "Use .mcp.json"

**Capabilities:**
- Model Context Protocol integration
- MCP server configuration
- Plugin MCP integration patterns

### plugin-settings
**Trigger when user asks about:**
- "Plugin settings"
- "Store plugin configuration"
- ".local.md files"
- "Plugin state files"

**Capabilities:**
- Plugin-specific configuration patterns
- `.claude/plugin-name.local.md` usage
- Settings file organization

---

## General Routing Logic

1. **Check for skill match first** - If user request maps to a skill trigger, delegate to that skill
2. **Use skills for specialized tasks** - Don't reinvent skill capabilities in main conversation
3. **Combine skills when needed** - Multiple skills can be used for complex requests
4. **Default to main agent** - For general coding, debugging, file operations not covered by skills

## Skill Usage Examples

```
User: "How should I set up Claude Code for this Java project?"
→ Delegate to: claude-automation-recommender

User: "Create a beautiful dashboard for monitoring"
→ Delegate to: frontend-design

User: "Add a slash command to run tests"
→ Delegate to: command-development

User: "Build an interactive regex tester"
→ Delegate to: playground

User: "Implement Stripe checkout"
→ Delegate to: stripe-best-practices

User: "Fix the authentication bug in UserService.java"
→ Handle directly (no skill delegation needed)
```

---

**Remember:** Skills are specialized tools. Use them when user requests align with their capabilities to provide expert-level assistance.
