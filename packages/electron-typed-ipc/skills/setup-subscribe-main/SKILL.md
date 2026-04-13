---
name: setup-subscribe-main
description: >
  Listening to events from main process in renderer; subscribe() returns cleanup function; preventing memory leaks with component lifecycle cleanup
type: core
library: electron-typed-ipc
library_version: "1.0.0-dev.0"
sources:
  - "kavsingh/electron-libs:packages/electron-typed-ipc/src/renderer.ts"
  - "kavsingh/electron-libs:apps/example/renderer/app.ts"
---

# Subscribing to Main Events

The renderer subscribes to events broadcast by the main process. The `subscribe()` method returns an unsubscribe function that must be called during cleanup to prevent memory leaks.

## Setup

Subscribe to events in the renderer:

```typescript
import { createIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";
import type { AppIpcDefinitions } from "~/electron/ipc";

const tipc = createIpcRenderer<AppIpcDefinitions>();

// Subscribe and store unsubscribe function
const unsubscribe = tipc.userNotification.subscribe((event, message) => {
	console.log("Notification:", message);
	// Update UI or state
});

// Later, when done listening:
unsubscribe();
```

In React with hooks:

```typescript
import { useEffect, useState } from "react";
import { createIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";
import type { AppIpcDefinitions } from "~/electron/ipc";

function MyComponent() {
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    const tipc = createIpcRenderer<AppIpcDefinitions>();

    // Subscribe and capture unsubscribe
    const unsubscribe = tipc.userNotification.subscribe((event, message) => {
      setNotifications((prev) => [...prev, message]);
    });

    // Cleanup on unmount
    return unsubscribe;
  }, []);

  return <div>{notifications.map((n) => <p key={n}>{n}</p>)}</div>;
}
```

## Core Patterns

**Subscribe on mount, unsubscribe on unmount**

Always bind subscription to component lifecycle:

```typescript
useEffect(() => {
	const tipc = createIpcRenderer<AppIpcDefinitions>();
	const unsubscribe = tipc.updates.subscribe((event, data) => {
		setState(data);
	});

	return unsubscribe; // Cleanup
}, []);
```

**Multiple separate subscriptions**

Each subscription needs its own unsubscribe:

```typescript
const tipc = createIpcRenderer<AppIpcDefinitions>();

const unsubUsers = tipc.userUpdated.subscribe((event, user) => {
	console.log("User:", user);
});

const unsubNotifications = tipc.notification.subscribe((event, notif) => {
	console.log("Notification:", notif);
});

// Later:
unsubUsers();
unsubNotifications();
```

**React Context for app-level events**

Share subscriptions across the app via context:

```typescript
import { createContext, useEffect, useState, ReactNode } from "react";
import { createIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";
import type { AppIpcDefinitions } from "~/electron/ipc";

interface IpcContextType {
  notifications: string[];
}

export const IpcContext = createContext<IpcContextType>({ notifications: [] });

export function IpcProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    const tipc = createIpcRenderer<AppIpcDefinitions>();

    const unsubscribe = tipc.userNotification.subscribe((event, message) => {
      setNotifications((prev) => [...prev, message]);
    });

    return unsubscribe;
  }, []);

  return (
    <IpcContext.Provider value={{ notifications }}>
      {children}
    </IpcContext.Provider>
  );
}
```

**Screen reader announcements**

Use events to announce updates for accessibility:

```typescript
tipc.notification.subscribe((event, message) => {
	// Append to aria-live region for screen readers
	const announce = document.createElement("div");
	announce.setAttribute("aria-live", "polite");
	announce.textContent = message;
	document.body.appendChild(announce);

	// Remove after announcement
	setTimeout(() => announce.remove(), 1000);
});
```

## Common Mistakes

### HIGH Subscribing multiple times without cleanup creates duplicate listeners

Wrong:

```typescript
// In mount() or effect called multiple times
tipc.updates.subscribe((event, data) => {
	console.log(data);
});
// Result: handler called N times per event (listeners stack)
```

Correct:

```typescript
const unsubscribe = tipc.updates.subscribe((event, data) => {
	console.log(data);
});
// Call unsubscribe() when done
unsubscribe();
```

Each call to `subscribe()` registers a new listener with the preload API. If you call `subscribe()` multiple times without unsubscribing, listeners stack and each event triggers multiple handlers.

Source: kvsingh/electron-libs:packages/electron-typed-ipc/src/renderer.ts subscribeProxy

### HIGH Assuming subscribe cleans up on component unmount automatically

Wrong:

```typescript
useEffect(() => {
	tipc.updates.subscribe((event, data) => setState(data));
}, []); // Memory leak! No cleanup
```

Correct:

```typescript
useEffect(() => {
	const unsubscribe = tipc.updates.subscribe((event, data) => setState(data));
	return unsubscribe; // Cleanup function
}, []);
```

Unlike React hooks (`useEffect` cleanup), `subscribe()` does NOT auto-cleanup. You must manually call the returned unsubscribe function or return it from `useEffect()`. Forgetting cleanup causes listeners to persist after component unmount, preventing garbage collection.

Source: kvsingh/electron-libs:packages/electron-typed-ipc/src/renderer.ts subscribe() lifecycle
