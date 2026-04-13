---
name: setup-events-renderer
description: >
  Publishing events from renderer to main; send() API; fire-and-forget semantics; toHost flag for preload contexts
type: core
library: electron-typed-ipc
library_version: "1.0.0-dev.0"
sources:
  - "kavsingh/electron-libs:packages/electron-typed-ipc/src/renderer.ts"
  - "kavsingh/electron-libs:packages/electron-typed-ipc/src/preload.ts"
---

# Sending Events from Renderer

sendFromRenderer enables the renderer to publish events to the main process. Unlike queries, events are fire-and-forget and do not await a response.

## Setup

Define a sendFromRenderer handler and call it from the renderer:

```typescript
// ipc.ts
import {
	defineOperations,
	sendFromRenderer,
} from "@kavsingh/electron-typed-ipc/main";

export const ipcDefinition = defineOperations({
	userAction: sendFromRenderer<{ action: string; timestamp: number }>(
		(event, payload) => {
			console.log("User action:", payload.action);
			// Handle the event in main
		},
	),

	logError: sendFromRenderer<{ message: string; stack: string }>(
		(event, payload) => {
			console.error("Error from renderer:", payload);
			// Log or report error
		},
	),
});

// renderer.ts
import { createIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";
import type { AppIpcDefinitions } from "~/electron/ipc";

const tipc = createIpcRenderer<AppIpcDefinitions>();

// Send event — fire-and-forget
tipc.userAction.send({
	action: "button-click",
	timestamp: Date.now(),
});

// Send error
window.addEventListener("error", (event) => {
	tipc.logError.send({
		message: event.message,
		stack: event.error?.stack || "",
	});
});
```

## Core Patterns

**Send with undefined payload**

If the operation takes no data, call `send()` with no arguments:

```typescript
// ipc.ts
export const ipcDefinition = defineOperations({
	rendererReady: sendFromRenderer<undefined>((event) => {
		console.log("Renderer ready");
	}),
});

// renderer.ts
tipc.rendererReady.send(); // No argument needed
```

**Global error reporting**

Capture unhandled errors and send them to main:

```typescript
window.addEventListener("error", (event) => {
	tipc.logError.send({
		message: event.message,
		stack: event.error?.stack || "",
		url: window.location.href,
	});
});

// Also handle promise rejections
window.addEventListener("unhandledrejection", (event) => {
	tipc.logError.send({
		message: String(event.reason),
		stack: event.reason?.stack || "",
		url: window.location.href,
	});
});
```

**User interaction tracking**

Send lightweight user action events:

```typescript
document.addEventListener(
	"click",
	(event) => {
		const target = event.target as HTMLElement;
		if (target.id) {
			tipc.userAction.send({
				action: "click",
				elementId: target.id,
				timestamp: Date.now(),
			});
		}
	},
	true,
);
```

**Navigation events**

Track when renderer navigates or unloads:

```typescript
window.addEventListener("beforeunload", () => {
	tipc.sessionEnding.send();
});

// Or with state
tipc.navigationOccurred.send({
	from: window.location.pathname,
	timestamp: Date.now(),
});
```

## Common Mistakes

### MEDIUM Renderer send() not awaited but treated as fire-and-forget

Wrong:

```typescript
tipc.userUpdate.send({ userId: 123 });
window.location = "/other-page";
// Event may not reach main if page unloads immediately
```

Correct:

```typescript
// Ensure event is sent before navigation
await tipc.userUpdate.send({ userId: 123 });
window.location = "/other-page";

// Or use a brief delay
tipc.userUpdate.send({ userId: 123 });
await new Promise((r) => setTimeout(r, 100));
window.location = "/other-page";
```

`send()` is synchronous in the renderer (unlike `query()` and `mutate()`). If the renderer unloads immediately after calling `send()`, the event may be dropped. For critical events before navigation, await a small delay or store in localStorage as fallback.

Source: kvsingh/electron-libs:packages/electron-typed-ipc/src/renderer.ts sendProxy

### LOW Using toHost in non-preload contexts

Wrong:

```typescript
// In regular renderer (not preload)
tipc.channel.send(payload, { toHost: true });
// Does nothing special
```

Correct:

```typescript
// toHost is for preload-to-host communication
// In regular renderer, use default send()
tipc.channel.send(payload);

// toHost is used in preload for special sandbox behavior
// (not typically needed for application code)
```

The `toHost` flag is for preload script communication with isolated contexts. Regular renderer scripts should always use `send()` without the flag.

Source: kvsingh/electron-libs:packages/electron-typed-ipc/src/renderer.ts SendFromRendererOptions
