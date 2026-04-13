# Agent Configuration

<!-- intent-skills:start -->

# Skill mappings - when working in these areas, load the linked skill file into context.

skills:

- task: "Defining IPC operations (queries, mutations, events)"
  load: "node_modules/@kavsingh/electron-typed-ipc/skills/debugging-ipc-types/SKILL.md"
- task: "Setting up query handlers in the main process"
  load: "node_modules/@kavsingh/electron-typed-ipc/skills/setup-queries/SKILL.md"
- task: "Setting up mutation handlers in the main process"
  load: "node_modules/@kavsingh/electron-typed-ipc/skills/setup-mutations/SKILL.md"
- task: "Broadcasting events from the main process to renderer"
  load: "node_modules/@kavsingh/electron-typed-ipc/skills/setup-events-main/SKILL.md"
- task: "Integrating Node.js EventEmitter with IPC events"
  load: "node_modules/@kavsingh/electron-typed-ipc/skills/integrate-event-emitters/SKILL.md"
- task: "Setting up preload security and IPC exposure"
  load: "node_modules/@kavsingh/electron-typed-ipc/skills/end-to-end-setup/SKILL.md"
- task: "Validating IPC message senders and security"
  load: "node_modules/@kavsingh/electron-typed-ipc/skills/validate-message-senders/SKILL.md"
- task: "Publishing events from the renderer to main process"
  load: "node_modules/@kavsingh/electron-typed-ipc/skills/setup-events-renderer/SKILL.md"
- task: "Listening to events from main process in renderer"
  load: "node_modules/@kavsingh/electron-typed-ipc/skills/setup-subscribe-main/SKILL.md"
- task: "Setting up custom serializers for Date, Map, Set, and custom types"
  load: "node_modules/@kavsingh/electron-typed-ipc/skills/setup-serialization/SKILL.md"
- task: "End-to-end testing IPC workflows with Playwright"
  load: "node_modules/@kavsingh/electron-typed-ipc/skills/end-to-end-setup/SKILL.md"
- task: "Integrating TanStack Query and Redux with IPC"
load: "node_modules/@kavsingh/electron-typed-ipc/skills/integrate-state-management/SKILL.md"
<!-- intent-skills:end -->
