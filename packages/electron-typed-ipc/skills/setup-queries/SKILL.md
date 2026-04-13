---
name: setup-queries
description: >
  Creating async request-response handlers from renderer to main process; registering handlers with createIpcMain; disposal callbacks; error handling and serialization
type: core
library: electron-typed-ipc
library_version: "1.0.0-dev.0"
sources:
  - "kavsingh/electron-libs:packages/electron-typed-ipc/src/main.ts"
  - "kavsingh/electron-libs:apps/example/electron/ipc.ts"
---

# Setting Up Queries

A query is a request-response operation from renderer to main process. The renderer calls `tipc.operation.query(input)` and awaits a response. Queries are async-friendly and automatically serialize/deserialize payload data.

## Setup

Define query operations and register them in the main process:

```typescript
// ipc.ts — operation definitions
import { defineOperations, query } from "@kavsingh/electron-typed-ipc/main";

export const ipcDefinition = defineOperations({
	getUserData: query<{ id: string; name: string }, { userId: string }>(
		(event, input) => {
			// event is IpcMainInvokeEvent — contains sender window info
			// input is the typed argument from renderer
			return { id: input.userId, name: "Alice" };
		},
	),

	getAsyncData: query<string, undefined>(async (event) => {
		// Handlers can be async
		const result = await fetchData();
		return result;
	}),
});

// main.ts
import { createIpcMain } from "@kavsingh/electron-typed-ipc/main";
import { ipcDefinition } from "./ipc";

const disposeIpc = createIpcMain(ipcDefinition);

// CRITICAL: Dispose on app quit to clean up handlers
app.on("quit", disposeIpc);

// renderer.ts
import { createIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";
import type { AppIpcDefinitions } from "~/electron/ipc";

const tipc = createIpcRenderer<AppIpcDefinitions>();

// Call query and await
const response = await tipc.getUserData.query({ userId: "123" });
```

## Core Patterns

**Async database queries in handler**

Handlers support async operations. Errors are caught and serialized automatically:

```typescript
query<User[], string>(async (event, userId) => {
	return await db.users.find({ id: userId });
});
```

**Access IpcMainEvent for sender validation**

The `event` parameter is `IpcMainEvent`. Use it to validate the sender:

```typescript
query<string, undefined>((event, input) => {
	// Validate sender before returning sensitive data
	if (event.sender.getURL() !== APPLICATION_URL) {
		throw new Error("Unauthorized");
	}
	return sensitiveData;
});
```

**Chain with error handling in renderer**

Errors thrown in the handler are caught and re-thrown in the renderer:

```typescript
try {
	const result = await tipc.operation.query(input);
} catch (err) {
	if (err instanceof Error && err.message.includes("Unauthorized")) {
		// Handle auth failure
	}
}
```

**Query with multiple operations**

Group related queries in your definition:

```typescript
export const ipcDefinition = defineOperations({
	listUsers: query<User[], undefined>(async (event) => {
		return await db.users.getAll();
	}),

	getUser: query<User, string>(async (event, userId) => {
		return await db.users.get(userId);
	}),

	getUserCount: query<number, undefined>(async (event) => {
		return await db.users.count();
	}),
});
```

## Common Mistakes

### CRITICAL Calling createIpcMain but not registering dispose callback

Wrong:

```typescript
import { createIpcMain } from "@kavsingh/electron-typed-ipc/main";

const app = createIpcMain(ipcDefinition);
// Missing: app.on("quit", disposeIpc)
```

Correct:

```typescript
const disposeIpc = createIpcMain(ipcDefinition);
app.on("quit", disposeIpc);
```

`createIpcMain` returns a `DisposeFn` that must be called on app quit. Without it, IPC handlers continue listening after the app exits, causing memory leaks and preventing clean shutdown.

Source: kvsingh/electron-libs:apps/example/electron/main.ts

### CRITICAL Querying before exposeTypedIpc() is called in preload

Wrong:

```typescript
// preload.ts — missing exposeTypedIpc()
import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("other", {});

// renderer.ts
const tipc = createIpcRenderer(); // Throws immediately
```

Correct:

```typescript
// preload.ts
import { exposeTypedIpc } from "@kavsingh/electron-typed-ipc/preload";

exposeTypedIpc();

// renderer.ts
const tipc = createIpcRenderer(); // ✓ works
const response = await tipc.operation.query();
```

The renderer must have access to the preload API before calling `createIpcRenderer()`. If the preload script never calls `exposeTypedIpc()`, the renderer will throw "object named **ELECTRON_TYPED_IPC** not found on window".

Source: kvsingh/electron-libs:packages/electron-typed-ipc/src/renderer.ts createIpcRenderer error

### MEDIUM Throwing non-Error values in handler

Wrong:

```typescript
query<string, undefined>((event) => {
	throw { code: "ERR_CUSTOM", message: "Failed" };
});
```

Correct:

```typescript
query<string, undefined>((event) => {
	const error = new Error("Failed");
	(error as any).code = "ERR_CUSTOM";
	throw error;
});
```

Errors are caught and serialized. Non-Error throws are wrapped in `new Error(String(cause))`, which loses the original object structure and properties. Always throw an Error instance to preserve custom properties.

Source: kvsingh/electron-libs:packages/electron-typed-ipc/src/main.ts addHandler
