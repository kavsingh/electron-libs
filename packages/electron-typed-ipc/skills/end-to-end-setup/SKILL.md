---
name: end-to-end-setup
description: >
  Complete workflow from preload exposure through renderer initialization; disposal lifecycle; ensuring all pieces are wired correctly
type: lifecycle
library: electron-typed-ipc
library_version: "1.0.0-dev.0"
requires:
  - setup-queries
  - setup-events-main
  - setup-subscribe-main
sources:
  - "kavsingh/electron-libs:packages/electron-typed-ipc/src/preload.ts"
  - "kavsingh/electron-libs:apps/example/electron/main.ts"
  - "kavsingh/electron-libs:apps/example/renderer/app.ts"
---

# End-to-End IPC Setup

This is a complete workflow covering all four pieces required for electron-typed-ipc to work:

1. **Operation definitions** — define what operations exist
2. **Preload script** — expose the IPC API to renderer
3. **Main process** — register handlers and clean up
4. **Renderer** — initialize and call operations

Missing any piece breaks the flow.

## Complete Example

**`ipc.ts` — operation definitions:**

```typescript
import EventEmitter from "node:events";
import {
	defineOperations,
	query,
	mutation,
	sendFromMain,
	sendFromRenderer,
} from "@kavsingh/electron-typed-ipc/main";

const emitter = new EventEmitter();

export const ipcDefinition = defineOperations({
	// Query
	getStatus: query<string, undefined>((event) => "ready"),

	// Mutation
	updateStatus: mutation<boolean, string>((event, status) => {
		emitter.emit("status-changed", status);
		return true;
	}),

	// Send from main
	statusUpdated: sendFromMain<string>(({ send }) => {
		const handler = (status: string) => send({ payload: status });
		emitter.on("status-changed", handler);
		return () => emitter.removeListener("status-changed", handler);
	}),

	// Send from renderer
	userAction: sendFromRenderer<{ action: string }>((event, payload) => {
		console.log("User action:", payload.action);
	}),
});

export type AppIpcDefinitions = typeof ipcDefinition;
```

**`preload.ts` — preload script:**

```typescript
import { exposeTypedIpc } from "@kavsingh/electron-typed-ipc/preload";

// Must be called during preload to expose IPC to renderer
exposeTypedIpc();
```

**`main.ts` — main process:**

```typescript
import path from "node:path";
import { app, BrowserWindow } from "electron";
import { createIpcMain } from "@kavsingh/electron-typed-ipc/main";
import { ipcDefinition } from "./ipc";

const dirname = import.meta.dirname;

async function init() {
	await app.whenReady();

	const appWindow = new BrowserWindow({
		webPreferences: {
			preload: path.resolve(dirname, "preload.cjs"),
		},
	});

	// Register handlers
	const disposeIpc = createIpcMain(ipcDefinition);

	// CRITICAL: Dispose on quit
	app.on("quit", disposeIpc);

	void appWindow.loadURL("app://bundle");
}

init().catch(console.error);
```

**`renderer.ts` — renderer script:**

```typescript
import { createIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";
import type { AppIpcDefinitions } from "~/electron/ipc";

// Initialize renderer IPC
const tipc = createIpcRenderer<AppIpcDefinitions>();

// Query
const status = await tipc.getStatus.query();
console.log("Status:", status);

// Mutation
await tipc.updateStatus.mutate("active");

// Subscribe to events
const unsubscribe = tipc.statusUpdated.subscribe((event, status) => {
	console.log("Status changed:", status);
});

// Send event
tipc.userAction.send({ action: "button-click" });

// Cleanup on page unload
window.addEventListener("beforeunload", unsubscribe);
```

## Checklist

Use this checklist to verify all pieces are in place:

- [ ] **Operations defined** — `defineOperations()` called with all query/mutation/send operations
- [ ] **Preload exposed** — `exposeTypedIpc()` called in preload script
- [ ] **Main registered** — `createIpcMain()` called with definition
- [ ] **Disposal wired** — `app.on("quit", disposeIpc)` registered
- [ ] **Renderer initialized** — `createIpcRenderer()` called with type parameter
- [ ] **Handlers validated** — All handlers check `event.sender` before returning sensitive data
- [ ] **Serializers consistent** — If custom serializers used, same instance in main and renderer

## Common Mistakes

### CRITICAL Incomplete setup sequence leaves part of IPC non-functional

Wrong:

```typescript
// main.ts has createIpcMain but no disposal
const app = createIpcMain(ipcDefinition);
// Missing: app.on("quit", disposeIpc)

// preload.ts missing exposeTypedIpc()
// Result: renderer throws "object named __ELECTRON_TYPED_IPC__ not found"
```

Correct:

```typescript
// ipc.ts: define operations
export const ipcDefinition = defineOperations({ ... });

// main.ts: register and dispose
const disposeIpc = createIpcMain(ipcDefinition);
app.on("quit", disposeIpc);

// preload.ts: expose
import { exposeTypedIpc } from "@kavsingh/electron-typed-ipc/preload";
exposeTypedIpc();

// renderer.ts: initialize
const tipc = createIpcRenderer<typeof ipcDefinition>();
```

All four pieces are required. Missing any one breaks the entire flow:

- No definitions → nothing to register
- No preload → renderer can't find the IPC API
- No main registration → handlers never set up
- No disposal → memory leaks on shutdown

Source: kvsingh/electron-libs:apps/example/electron/main.ts integration pattern

---

## Next Steps

- **Debugging types?** See [Debugging IPC types](../debugging-ipc-types/SKILL.md)
- **Need custom serialization?** See [Setting up custom serialization](../setup-serialization/SKILL.md)
- **Using event emitters?** See [Integrating with Node event emitters](../integrate-event-emitters/SKILL.md)
