---
name: integrate-event-emitters
description: >
  Event bus pattern for main process; connecting Node.js EventEmitter to sendFromMain; listener lifecycle and architecture patterns
type: composition
library: electron-typed-ipc
library_version: "1.0.0-dev.0"
requires:
  - setup-events-main
sources:
  - "kavsingh/electron-libs:apps/example/electron/ipc.ts"
---

# Integrating with Node Event Emitters

The recommended pattern for `sendFromMain` is to use a Node.js `EventEmitter` as a central event bus. This decouples your main process logic from IPC concerns.

## Setup

Create an event bus and wire `sendFromMain` to it:

```typescript
import EventEmitter from "node:events";
import {
	defineOperations,
	mutation,
	sendFromMain,
	sendFromRenderer,
} from "@kavsingh/electron-typed-ipc/main";

// Central event bus
export const eventBus = new EventEmitter<{
	"user-updated": [{ id: string; name: string }];
	"data-synced": [string];
	"error-occurred": [{ message: string }];
}>();

export const ipcDefinition = defineOperations({
	updateUser: mutation<boolean, { id: string; name: string }>(
		(event, input) => {
			updateDatabase(input);
			// Emit event for all listeners (IPC and internal)
			eventBus.emit("user-updated", input);
			return true;
		},
	),

	userUpdated: sendFromMain<{ id: string; name: string }>(({ send }) => {
		const handler = (data: { id: string; name: string }) => {
			send({ payload: data });
		};
		eventBus.on("user-updated", handler);
		return () => eventBus.removeListener("user-updated", handler);
	}),

	dataSynced: sendFromMain<string>(({ send }) => {
		const handler = (status: string) => send({ payload: status });
		eventBus.on("data-synced", handler);
		return () => eventBus.removeListener("data-synced", handler);
	}),
});

// Emit from anywhere in main process
export function notifyUserUpdate(data: { id: string; name: string }) {
	eventBus.emit("user-updated", data);
}

export function notifyDataSync(status: string) {
	eventBus.emit("data-synced", status);
}
```

In the renderer:

```typescript
import { createIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";
import type { AppIpcDefinitions } from "~/electron/ipc";

const tipc = createIpcRenderer<AppIpcDefinitions>();

// Subscribe to broadcasted events
const unsubUser = tipc.userUpdated.subscribe((event, data) => {
	console.log("User updated:", data);
});

const unsubSync = tipc.dataSynced.subscribe((event, status) => {
	console.log("Data synced:", status);
});

// Cleanup
window.addEventListener("beforeunload", () => {
	unsubUser();
	unsubSync();
});
```

## Core Patterns

**Centralized event bus for cross-module communication**

Keep the event bus in a shared module so different parts of your main process can emit without importing IPC directly:

```typescript
// events.ts
import EventEmitter from "node:events";

export const eventBus = new EventEmitter<{
	"db-updated": [{ table: string; id: string }];
}>();

// database.ts
import { eventBus } from "./events";

function updateTable(table: string, id: string, data: any) {
	db.tables[table].update(id, data);
	eventBus.emit("db-updated", { table, id });
}

// ipc.ts — just wires the bus to IPC
import { eventBus } from "./events";

export const ipcDefinition = defineOperations({
	dbUpdated: sendFromMain<{ table: string; id: string }>(({ send }) => {
		const handler = (data) => send({ payload: data });
		eventBus.on("db-updated", handler);
		return () => eventBus.removeListener("db-updated", handler);
	}),
});
```

**Filtered events for per-user subscriptions**

Emit fine-grained events and let subscribers filter:

```typescript
const eventBus = new EventEmitter<{
	"user-event": [{ userId: string; type: string; data: any }];
}>();

export const ipcDefinition = defineOperations({
	userEvent: sendFromMain<{ userId: string; type: string; data: any }>(
		({ send }) => {
			const handler = (event) => send({ payload: event });
			eventBus.on("user-event", handler);
			return () => eventBus.removeListener("user-event", handler);
		},
	),
});

// Renderer: filter for current user
const currentUserId = "user-123";
const unsub = tipc.userEvent.subscribe((event, data) => {
	if (data.userId === currentUserId) {
		handleEvent(data);
	}
});
```

**Rate limiting broadcasts**

Debounce high-frequency events to avoid overwhelming renderers:

```typescript
import { debounce } from "lodash-es";

const eventBus = new EventEmitter<{
	"cursor-moved": [{ x: number; y: number }];
}>();

const debouncedEmit = debounce((position: { x: number; y: number }) => {
	eventBus.emit("cursor-moved", position);
}, 100);

// Called frequently, but IPC emits only every 100ms
export function onCursorMove(position: { x: number; y: number }) {
	debouncedEmit(position);
}
```

## Common Mistakes

### MEDIUM Emitter listeners accumulate without cleanup between app reloads

Wrong:

```typescript
// Called on every page reload
createIpcMain(ipcDefinition);
// Old listeners still attached to eventBus

// Result: each event triggers multiple handlers
```

Correct:

```typescript
// Ensure createIpcMain is called once, or dispose before recreating
const disposeIpc = createIpcMain(ipcDefinition);
app.on("quit", disposeIpc);

// If reloading:
disposeIpc(); // Clean up old handlers
const disposeIpc2 = createIpcMain(ipcDefinition); // Register new ones
```

The event bus is typically global and persists. If you call `createIpcMain()` multiple times without disposing, old listeners remain and new ones stack. The `DisposeFn` removes all registered listeners from the bus.

Source: kvsingh/electron-libs:packages/electron-typed-ipc/src/main.ts SendFromMain lifecycle

---

## See Also

- **Sending events from main** — covers sendFromMain patterns and cleanup
- **Subscribing to main events** — renderer-side subscription handling
- **Integrating with async state management** — coordinate event bus with TanStack Query or Redux
