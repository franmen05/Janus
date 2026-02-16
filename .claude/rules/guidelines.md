---
description: General development guidelines for Janus project
globs: "**"
---

# General Guidelines

1. **Read before modifying** — Always read files before suggesting changes
2. **Minimize changes** — Only edit what's necessary; don't refactor unrelated code
3. **Follow existing patterns** — Match the style of surrounding code
4. **Test after changes** — `cd janus-backend && ./gradlew test`
5. **No sensitive data in commits** — Never commit .env, credentials, secrets
6. **Confirm before pushing** — Always ask before `git push` or destructive git ops
7. **Scope commits per project** — Keep commits focused on specific components
