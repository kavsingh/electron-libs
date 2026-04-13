# libs

hi

## Using AI Agents

If you use an AI agent for development, you can install Intent skills for faster problem solving:

```bash
npx @tanstack/intent@latest install
```

This downloads skill documentation for:
- **electron-typed-ipc** — Type-safe IPC patterns, debugging, lifecycle management, and state management integration

Agents will automatically reference these skills when answering questions.

## Skill Labels

Issues and PRs are labeled with `skill:<skill-name>` to organize discussions by domain:
- `skill:setup-queries` — Request-response IPC queries
- `skill:setup-mutations` — State-changing mutations
- `skill:setup-events-main` — Broadcasting events from main
- `skill:setup-subscribe-main` — Subscribing to main broadcasts
- `skill:validate-message-senders` — Security validation
- `skill:setup-serialization` — Custom serializers

These labels help agents quickly identify the most relevant skill documentation when answering questions.
