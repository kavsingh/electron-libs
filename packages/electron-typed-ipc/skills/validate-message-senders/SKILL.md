---
name: validate-message-senders
description: >
  Security validation using IpcMainEvent; checking sender origin; preventing unauthorized IPC access; preload security
type: core
library: electron-typed-ipc
library_version: "1.0.0-dev.0"
sources:
  - "kavsingh/electron-libs:packages/electron-typed-ipc/src/internal.ts"
  - "kavsingh/electron-libs:packages/electron-typed-ipc/src/main.ts"
---

# Validating Message Senders

Every IPC handler receives an `IpcMainEvent` parameter that exposes sender information. Always validate the sender before exposing sensitive operations or data.

## Setup

Validate sender origin in handlers:

```typescript
import { defineOperations, query } from "@kavsingh/electron-typed-ipc/main";

const TRUSTED_URLS = ["app://bundle", "app://localhost"];

export const ipcDefinition = defineOperations({
	getSensitiveData: query<string, undefined>((event) => {
		// Validate sender
		const senderUrl = event.sender.getURL();
		if (!TRUSTED_URLS.includes(senderUrl)) {
			throw new Error("Unauthorized access");
		}
		return "sensitive data";
	}),

	updateSettings: mutation<boolean, { setting: string; value: any }>(
		(event, input) => {
			// Validate frame origin for deeper security
			if (event.sender.getWebPreferences().sandbox) {
				// Sandboxed renderer — more restrictive rules
			}
			updateSetting(input.setting, input.value);
			return true;
		},
	),
});
```

Also validate in event handlers:

```typescript
export const ipcDefinition = defineOperations({
	criticalEvent: sendFromRenderer<{ data: string }>((event, payload) => {
		// Validate sender before processing
		if (event.sender.getURL() !== TRUSTED_URL) {
			console.warn("Rejected event from untrusted sender");
			return;
		}
		processCriticalEvent(payload);
	}),
});
```

## Core Patterns

**Origin-based authorization**

Ensure renderers only access meant-for-them operations:

```typescript
const ADMIN_ONLY = "app://admin-panel";
const USER_APP = "app://user-app";

query<AdminData, undefined>((event) => {
	if (event.sender.getURL() !== ADMIN_ONLY) {
		throw new Error("Admin-only operation");
	}
	return getAdminData();
});
```

**Frame ID validation for multi-frame renderers**

When using multiple frames, validate frame origin:

```typescript
mutation<boolean, { setting: string }>((event, input) => {
	// Check if sender is main frame
	const isMainFrame = event.sender.mainFrame;
	if (!isMainFrame) {
		throw new Error("Can only be called from main frame");
	}
	updateSetting(input.setting);
	return true;
});
```

**Sandbox detection**

Respond differently to sandboxed vs non-sandboxed renderers:

```typescript
query<string, undefined>((event) => {
	const isSandboxed = event.sender.getWebPreferences().sandbox === true;

	if (isSandboxed) {
		// More restricted, less sensitive data
		return "limited data";
	} else {
		// Non-sandboxed renderer — higher risk
		throw new Error("Unsandboxed renderers cannot access this");
	}
});
```

**Deny untrusted sources entirely**

For maximum security, reject any unusual sources:

```typescript
const ALLOWED_URLS = new Set(["app://bundle"]);

function validateSender(event: IpcMainEvent) {
	const senderUrl = event.sender.getURL();
	if (!ALLOWED_URLS.has(senderUrl)) {
		throw new Error(`Unauthorized sender: ${senderUrl}`);
	}
}

query<Data, undefined>((event) => {
	validateSender(event);
	return getData();
});
```

## Common Mistakes

### HIGH Ignoring sender validation in handlers

Wrong:

```typescript
query<string, undefined>((event) => {
	// No validation — any renderer can call this
	return sensitiveData;
});
```

Correct:

```typescript
query<string, undefined>((event) => {
	if (event.sender.getURL() !== TRUSTED_URL) {
		throw new Error("Unauthorized sender");
	}
	return sensitiveData;
});
```

`IpcMainEvent` exposes sender information; ignoring it allows any renderer process to invoke handlers. Always validate the sender's origin before exposing sensitive operations or data.

Source: kvsingh/electron-libs:packages/electron-typed-ipc/src/main.ts QueryImpl parameter

---

## See Also

- **Setting up queries** — understand handler signatures and error handling
- **Setting up mutations** — apply the same validation patterns to state-changing operations
- **End-to-end IPC setup** — integrate validation into your complete setup flow
