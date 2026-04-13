---
name: debugging-ipc-types
description: >
  Fixing TypeScript errors in operation definitions; understanding Query<Response, Input> type parameter order; optional input handling and undefined payload typing
type: core
library: electron-typed-ipc
library_version: "1.0.0-dev.0"
sources:
  - "kavsingh/electron-libs:packages/electron-typed-ipc/src/internal.ts"
  - "kavsingh/electron-libs:packages/electron-typed-ipc/src/main.test-d.ts"
---

# Debugging IPC Types

electron-typed-ipc uses strict TypeScript generics to enforce compile-time type safety. The type system prevents entire classes of bugs but can be confusing when parameters are in unexpected order or when undefined vs optional arguments differ.

## Setup

Define an operation with explicit type parameters:

```typescript
import {
	defineOperations,
	query,
	mutation,
} from "@kavsingh/electron-typed-ipc/main";

// Define operations with type parameters
export const ipcDefinition = defineOperations({
	// Query<Response, Input> — NOT Query<Input, Response>
	getUserData: query<string, { id: string }>((event, input) => {
		return "user data";
	}),

	// Mutation<Response, Input>
	updateUser: mutation<boolean, { id: string; name: string }>(
		(event, input) => {
			return true;
		},
	),

	// Operations with no input: use undefined
	getStatus: query<string, undefined>((event) => {
		return "ready";
	}),
});

export type AppIpcDefinitions = typeof ipcDefinition;
```

## Core Patterns

**Understand the type parameter order**

Query and Mutation both follow `Operation<Response, Input>` order. This is inverted from what some developers expect:

```typescript
// RIGHT: Response type first
query<number, undefined>((event) => 42);

// WRONG: This will cause type errors downstream
query<undefined, number>((event, input) => 42);
```

**Distinguish undefined input from optional input**

When an operation takes no required input, the input type is `undefined`. In the renderer, this results in a zero-argument method call:

```typescript
// Main: no input needed
query<string, undefined>((event) => "response");

// Renderer: called with NO arguments
await tipc.operation.query(); // ✓ correct
await tipc.operation.query(undefined); // ✗ wrong — passing undefined explicitly
```

**Use discriminated unions for optional payloads**

If an operation can accept input but it's optional, use a union that discriminates optional from required:

```typescript
// Optional payload: can be called with or without input
query<string, { data?: string } | undefined>((event, input) => {
	return input?.data ?? "default";
});

// Renderer: both work
await tipc.operation.query();
await tipc.operation.query({ data: "value" });
```

## Common Mistakes

### HIGH Query/Mutation type parameter order reversed

Wrong:

```typescript
query<{ id: string }, string>((event, input) => ({
	id: "123",
}));
```

Correct:

```typescript
query<string, { id: string }>((event, input) => "user-data-string");
```

The order is `Query<Response, Input>`. Reversing it causes type mismatches in renderer code when you try to use the response.

Source: kvsingh/electron-libs:packages/electron-typed-ipc/src/internal.ts

### HIGH Handler return type does not match response generic

Wrong:

```typescript
query<string, undefined>((event) => ({
	data: "string",
}));
```

Correct:

```typescript
query<{ data: string }, undefined>((event) => ({
	data: "string",
}));
```

TypeScript enforces strict return type matching. If the generic specifies `string`, the handler must return exactly `string` or `Promise<string>`.

Source: kvsingh/electron-libs:packages/electron-typed-ipc/src/main.test-d.ts

### MEDIUM Optional input not correctly typed for renderer consumption

Wrong:

```typescript
query<string, undefined>((event) => "response");

// Renderer caller thinks it needs optional arg
await tipc.operation.query(undefined);
```

Correct:

```typescript
query<string, undefined>((event) => "response");

// Renderer: no arguments required
await tipc.operation.query();
```

With `undefined` input, the renderer method takes zero required parameters. Passing `undefined` explicitly is a type error.

Source: kvsingh/electron-libs:packages/electron-typed-ipc/src/internal.ts SendFromRendererArgs

### MEDIUM Treating undefined payload as "no argument" when they differ

Wrong:

```typescript
sendFromRenderer<undefined>((event, payload) => {
	console.log(payload); // payload is undefined but still typed
});

// Renderer called with typed args
tipc.channel.send(); // OK
tipc.channel.send(undefined); // Also OK — undefined is explicit
```

Correct:

```typescript
// If you want truly no-argument send:
sendFromRenderer<undefined>((event, payload) => {
	// payload is typed as undefined
});

// Renderer: both of these are equivalent
tipc.channel.send();
tipc.channel.send(undefined);

// Different: optional payload
sendFromRenderer<{ data: string } | undefined>((event, payload) => {
	// payload can be undefined or an object
});
```

`undefined` as a payload type is still a typed parameter. The confusion arises when mixing undefined with truly optional arguments.

Source: kvsingh/electron-libs:packages/electron-typed-ipc/src/internal.ts SendFromRendererArgs
