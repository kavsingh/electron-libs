---
name: setup-mutations
description: >
  Creating state-changing operations from renderer to main; setting up mutation handlers; distinguishing mutations from queries semantically
type: core
library: electron-typed-ipc
library_version: "1.0.0-dev.0"
sources:
  - "kavsingh/electron-libs:packages/electron-typed-ipc/src/main.ts"
---

# Setting Up Mutations

A mutation is a state-changing operation from renderer to main. It has the same signature as a query but carries semantic meaning: the handler is expected to modify state in the main process and return a success/failure response.

## Setup

Define mutations in your IPC definition:

```typescript
import { defineOperations, mutation } from "@kavsingh/electron-typed-ipc/main";

export const ipcDefinition = defineOperations({
	// Mutation<Response, Input>
	updateUser: mutation<{ success: boolean }, { id: string; name: string }>(
		(event, input) => {
			// Update state in main process
			db.users.update(input.id, { name: input.name });
			return { success: true };
		},
	),

	deleteUser: mutation<{ deleted: boolean }, string>(async (event, userId) => {
		await db.users.delete(userId);
		return { deleted: true };
	}),
});

// renderer.ts
import type { AppIpcDefinitions } from "~/electron/ipc";
import { createIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";

const tipc = createIpcRenderer<AppIpcDefinitions>();

// Call mutation and await result
const result = await tipc.updateUser.mutate({ id: "123", name: "Bob" });
console.log(result.success);
```

## Core Patterns

**Return a result object indicating success/failure**

Mutations typically return a response that indicates success or error:

```typescript
mutation<{ success: boolean; error?: string }, { id: string }>(
	(event, input) => {
		try {
			updateState(input.id);
			return { success: true };
		} catch (err) {
			return { success: false, error: err.message };
		}
	},
);
```

**Validate sender before state changes**

Always validate the mutation source using `event.sender`:

```typescript
mutation<{ success: boolean }, { id: string; status: string }>(
	(event, input) => {
		if (event.sender.getURL() !== TRUSTED_URL) {
			throw new Error("Unauthorized mutation");
		}
		updateUserStatus(input.id, input.status);
		return { success: true };
	},
);
```

**Mutations that trigger broadcasts**

After a mutation, you often want to notify other renderers:

```typescript
import EventEmitter from "node:events";

const emitter = new EventEmitter();

export const ipcDefinition = defineOperations({
	updateUser: mutation<{ success: boolean }, { id: string }>((event, input) => {
		updateState(input.id);
		emitter.emit("user-updated", input.id);
		return { success: true };
	}),

	userUpdated: sendFromMain<string>(({ send }) => {
		const handler = (userId: string) => send({ payload: userId });
		emitter.on("user-updated", handler);
		return () => emitter.off("user-updated", handler);
	}),
});
```

**Async mutations with database operations**

Mutations support async operations for database writes:

```typescript
mutation<{ id: string; created: boolean }, { name: string }>(
	async (event, input) => {
		const user = await db.users.create({ name: input.name });
		emitter.emit("user-created", user);
		return { id: user.id, created: true };
	},
);
```

## Common Mistakes

### MEDIUM Mutation handler signature identical to query but semantic difference missed

Wrong:

```typescript
// Treating mutation like a query (read-only)
mutation<User, string>((event, userId) => {
	return getUserData(userId); // Just reading, not mutating
});
```

Correct:

```typescript
// Mutation should modify state
mutation<{ success: bool }, string>((event, userId) => {
	updateUserStatus(userId, "active");
	return { success: true };
});
```

Query and Mutation have identical function signatures: `(event, input) => response`. The difference is semantic — mutations should modify state in the main process. Using a mutation that only reads is misleading and should be a query instead.

Source: Maintainer interview — semantic difference in usage
