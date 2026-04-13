---
name: setup-events-main
description: >
  Broadcasting events from main process to renderer(s); sendFromMain pattern; listener lifecycle and cleanup; targeting windows and frames; integration with Node.js event emitters
type: core
library: electron-typed-ipc
library_version: "1.0.0-dev.0"
sources:
  - "kavsingh/electron-libs:packages/electron-typed-ipc/src/main.ts"
  - "kavsingh/electron-libs:apps/example/electron/ipc.ts"
---

# Sending Events from Main

sendFromMain enables the main process to broadcast events to one or more renderer windows. Unlike queries, events are one-directional and typically driven by a Node.js event emitter in the main process.

## Setup

Define a sendFromMain handler connected to an event bus:

```typescript
import EventEmitter from "node:events";
import {
	defineOperations,
	sendFromMain,
} from "@kavsingh/electron-typed-ipc/main";

const emitter = new EventEmitter<{ notification: [string] }>();

export const ipcDefinition = defineOperations({
	userNotification: sendFromMain<string>(({ send }) => {
		// Handler receives a send() callback
		const handler = (message: string) => {
			send({ payload: message });
		};

		// Listen for events from elsewhere in main
		emitter.on("notification", handler);

		// CRITICAL: Return cleanup function
		return () => {
			emitter.removeListener("notification", handler);
		};
	}),
});

// Emit events from anywhere in main process
export function notifyRenderers(message: string) {
	emitter.emit("notification", message);
}

// renderer.ts
import { createIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";
import type { AppIpcDefinitions } from "~/electron/ipc";

const tipc = createIpcRenderer<AppIpcDefinitions>();

// Subscribe in renderer
const unsubscribe = tipc.userNotification.subscribe((event, message) => {
	console.log("Notification:", message);
});

// Cleanup
unsubscribe();
```

## Core Patterns

**Broadcast to all windows**

By default, `send()` broadcasts to all open windows:

```typescript
sendFromMain<{ id: string }>(({ send }) => {
	const handler = (data: { id: string }) => {
		send({ payload: data }); // All windows receive
	};

	emitter.on("update", handler);
	return () => emitter.removeListener("update", handler);
});
```

**Target specific windows**

Use `targetWindows` to send to specific windows:

```typescript
sendFromMain<string>(({ send }) => {
	const handler = (message: string) => {
		const targetWindow = BrowserWindow.getAllWindows()[0];
		send({ payload: message, targetWindows: [targetWindow] });
	};

	emitter.on("direct-message", handler);
	return () => emitter.removeListener("direct-message", handler);
});
```

**Send to specific frames**

Use `frames` to target a specific frame within a window:

```typescript
sendFromMain<string>(({ send }) => {
	const handler = (message: string) => {
		const frameId = 1; // Frame ID from WebContents API
		send({ payload: message, frames: frameId });
	};

	emitter.on("frame-message", handler);
	return () => emitter.removeListener("frame-message", handler);
});
```

**Error handling in event handlers**

Handlers are protected from errors. If a handler throws, it's logged but doesn't break other handlers:

```typescript
sendFromMain<string>(({ send }) => {
	const handler = (message: string) => {
		try {
			const processed = expensiveProcessing(message);
			send({ payload: processed });
		} catch (err) {
			console.error("Handler error:", err);
			// Event not sent, but listener remains active
		}
	};

	emitter.on("data", handler);
	return () => emitter.removeListener("data", handler);
});
```

## Common Mistakes

### CRITICAL Forgetting to return cleanup function in sendFromMain handler

Wrong:

```typescript
sendFromMain<string>(({ send }) => {
	emitter.addListener("update", (msg) => send({ payload: msg }));
	// Missing return statement — listener never removed
});
```

Correct:

```typescript
sendFromMain<string>(({ send }) => {
	const handler = (msg: string) => send({ payload: msg });
	emitter.addListener("update", handler);
	return () => emitter.removeListener("update", handler);
});
```

The handler must return a `DisposeFn` (cleanup function). Without it, event listeners accumulate and leak memory when the app exits or `createIpcMain()` is called multiple times.

Source: kvsingh/electron-libs:apps/example/electron/ipc.ts, kvsingh/electron-libs:packages/electron-typed-ipc/src/main.ts

### MEDIUM Trying to send to destroyed window

Wrong:

```typescript
send({ payload: "data", targetWindows: [closedWindow] });
// Silently skipped — no error
```

Correct:

```typescript
send({ payload: "data", targetWindows: BrowserWindow.getAllWindows() });
// Gets current windows; destroyed windows are skipped gracefully
```

`createIpcMain` checks `isDestroyed()` before sending, so destroyed windows are skipped silently. If you store references to `BrowserWindow` instances, they may be destroyed before you call `send()`. Always get fresh window references or rely on `getAllWindows()`.

Source: kvsingh/electron-libs:packages/electron-typed-ipc/src/main.ts sendToChannel

### MEDIUM Using targetWindows or frames without understanding WebContents API

Wrong:

```typescript
send({ payload: "data", frames: [1, 2] }); // Frames format unclear
```

Correct:

```typescript
// frames is a frameId (number) or [frameId, processId]
const frameId = 1;
send({ payload: "data", frames: frameId });

// Or tuple format
send({ payload: "data", frames: [frameId, processId] });
```

`frames` parameter maps to Electron's `WebContents.sendToFrame()` API, which expects a frameId or [frameId, processId] tuple. Passing an array directly will cause unexpected behavior.

Source: kvsingh/electron-libs:packages/electron-typed-ipc/src/internal.ts SendFromMainOptions

### MEDIUM Broadcasting complex objects without serializer

Wrong:

```typescript
sendFromMain<{ createdAt: Date }>(({ send }) => {
	emitter.on("update", (data: { createdAt: Date }) => {
		send({ payload: data }); // Date arrives as ISO string in renderer
	});
	return () => emitter.removeListener("update", handler);
});
```

Correct:

```typescript
// Use custom serializer in createIpcMain
const dateSerializer = createValueSerializer({
	isDeserialized: (value): value is Date => value instanceof Date,
	isSerialized: (value): value is string =>
		typeof value === "string" && !isNaN(Date.parse(value)),
	serialize: (value) => value.toISOString(),
	deserialize: (value) => new Date(value),
});

const serializer = createSerializer([dateSerializer]);
const disposeIpc = createIpcMain(definition, { serializer });
```

Default serializer passes through all values; Date, Map, Set, and custom classes lose their types. If you broadcast complex types, set up custom serializers on both `createIpcMain()` and `createIpcRenderer()`.

Source: kvsingh/electron-libs:packages/electron-typed-ipc/src/serializer.ts
