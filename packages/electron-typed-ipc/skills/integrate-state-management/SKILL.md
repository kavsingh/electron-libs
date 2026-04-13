---
name: integrate-state-management
description: >
  TanStack Query and Redux Toolkit integration; cache invalidation patterns; window lifecycle coordination; mapping IPC to queryFn and mutationFn
type: composition
library: electron-typed-ipc
library_version: "1.0.0-dev.0"
requires:
  - setup-queries
  - setup-mutations
  - setup-subscribe-main
sources: []
---

# Integrating with Async State Management

electron-typed-ipc integrates cleanly with TanStack Query and Redux Toolkit. Map IPC queries/mutations to `queryFn`/`mutationFn` and handle cache invalidation when server state changes.

## Setup with TanStack Query

Use IPC operations as `queryFn`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";
import type { AppIpcDefinitions } from "~/electron/ipc";

const tipc = createIpcRenderer<AppIpcDefinitions>();
const queryClient = useQueryClient();

// Query hook
export function useGetUser(userId: string) {
	return useQuery({
		queryKey: ["user", userId],
		queryFn: () => tipc.getUser.query({ userId }),
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

// Mutation hook with cache invalidation
export function useUpdateUser() {
	return useMutation({
		mutationFn: (input: { id: string; name: string }) =>
			tipc.updateUser.mutate(input),
		onSuccess: (data, input) => {
			// Invalidate user cache
			queryClient.invalidateQueries({ queryKey: ["user", input.id] });
		},
	});
}

// Subscribe to IPC events and invalidate cache
export function useUserUpdatesSubscription() {
	const queryClient = useQueryClient();

	useEffect(() => {
		const unsub = tipc.userUpdated.subscribe((event, user) => {
			// Update cache when IPC event arrives
			queryClient.setQueryData(["user", user.id], user);
		});

		return unsub;
	}, [queryClient]);
}
```

See [references/tanstack-query-pattern.md](references/tanstack-query-pattern.md) for a complete example.

## Setup with Redux Toolkit (RTK Query)

Define API slices with IPC endpoints:

```typescript
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { createIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";
import type { AppIpcDefinitions } from "~/electron/ipc";

const tipc = createIpcRenderer<AppIpcDefinitions>();

export const userApi = createApi({
	reducerPath: "userApi",
	baseQuery: fakeBaseQuery(),
	tagTypes: ["User"],
	endpoints: (builder) => ({
		getUser: builder.query({
			queryFn: async (userId: string) => {
				try {
					const data = await tipc.getUser.query({ userId });
					return { data };
				} catch (error) {
					return { error };
				}
			},
			providesTags: (result, error, userId) => [{ type: "User", id: userId }],
		}),

		updateUser: builder.mutation({
			queryFn: async (input: { id: string; name: string }) => {
				try {
					const data = await tipc.updateUser.mutate(input);
					return { data };
				} catch (error) {
					return { error };
				}
			},
			invalidatesTags: (result, error, input) => [
				{ type: "User", id: input.id },
			],
		}),
	}),
});
```

See [references/redux-toolkit-pattern.md](references/redux-toolkit-pattern.md) for a complete example.

## Core Patterns

**Handle Electron window lifecycle with cache**

When the main app window is minimized or refocused, refetch to ensure freshness:

```typescript
useEffect(() => {
	// Refetch on window focus
	const unsubFocus = tipc.appFocused.subscribe(() => {
		queryClient.refetchQueries({ queryKey: ["user"] });
	});

	// Preserve cache on minimize
	const unsubMinimize = tipc.appMinimized.subscribe(() => {
		queryClient.setDefaultOptions({
			queries: { staleTime: Infinity },
		});
	});

	return () => {
		unsubFocus();
		unsubMinimize();
	};
}, [queryClient]);
```

**Batch invalidations from multiple IPC events**

Prevent thrashing when multiple events arrive:

```typescript
import { useDeferredValue } from "react";

export function useUserEventsSubscription() {
	const queryClient = useQueryClient();
	const [invalidateKeys, setInvalidateKeys] = useState<string[]>([]);
	const deferredKeys = useDeferredValue(invalidateKeys);

	useEffect(() => {
		if (deferredKeys.length === 0) return;

		queryClient.invalidateQueries({ queryKey: ["user"] });
		setInvalidateKeys([]);
	}, [deferredKeys, queryClient]);

	useEffect(() => {
		const unsub = tipc.userUpdated.subscribe((event, user) => {
			setInvalidateKeys((prev) => [...prev, user.id]);
		});

		return unsub;
	}, []);
}
```

**Retry failed IPC operations with exponential backoff**

Configure TanStack Query retry strategy for IPC:

```typescript
useQuery({
	queryKey: ["user", userId],
	queryFn: () => tipc.getUser.query({ userId }),
	retry: 3,
	retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
});
```

**Handle serialization in query/mutation payloads**

If using custom serializers, ensure they're consistent:

```typescript
import {
	createSerializer,
	createValueSerializer,
} from "@kavsingh/electron-typed-ipc/main";

const dateSerializer = createValueSerializer({
	isDeserialized: (value): value is Date => value instanceof Date,
	isSerialized: (value): value is string =>
		typeof value === "string" && !isNaN(Date.parse(value)),
	serialize: (value) => value.toISOString(),
	deserialize: (value) => new Date(value),
});

const serializer = createSerializer([dateSerializer]);

const tipc = createIpcRenderer<AppIpcDefinitions>({ serializer });

// TanStack Query will receive Date objects, not strings
useQuery({
	queryKey: ["events"],
	queryFn: async () => {
		const events = await tipc.getEvents.query();
		// events[].timestamp is a Date object, not a string
		return events;
	},
});
```

## Common Mistakes

### MEDIUM TanStack Query caches stale data across window/process recreations

Wrong:

```typescript
useQuery({
	queryKey: ["user"],
	queryFn: () => tipc.getUser.query(),
	// Cache persists after renderer reload
});
// If IPC connection drops and reconnects, cache still served
```

Correct:

```typescript
useEffect(() => {
	// Invalidate on app focus or connection recovery
	window.addEventListener("focus", () => {
		queryClient.invalidateQueries({ queryKey: ["user"] });
	});

	// Or subscribe to reconnection event
	tipc.reconnected.subscribe(() => {
		queryClient.invalidateQueries();
	});
}, [queryClient]);
```

Query cache persists in memory. If the renderer process reloads or IPC connection drops and reconnects, old cache is still served until invalidated. Manually invalidate on app focus or connection recovery.

Source: Maintainer interview on state integration

### MEDIUM Redux cache invalidation not triggered by IPC events

Wrong:

```typescript
// Mutation runs but cache not invalidated for subscribers
mutation<boolean, string>((event, userId) => {
	updateUser(userId);
	// TanStack Query still has stale user data
	return true;
});
```

Correct:

```typescript
// After receiving event in renderer, manually revalidate
tipc.userUpdated.subscribe((event, user) => {
	queryClient.invalidateQueries({ queryKey: ["user", user.id] });
});

// Or use RTK Query tag invalidation
endPoint: {
	invalidatesTags: (result, error, input) => [{ type: "User", id: input.id }];
}
```

RTK Query mutations must explicitly trigger tag invalidation. IPC `sendFromMain` events don't auto-invalidate; you must manually call `invalidateQueries()` when you receive the event.

Source: Maintainer interview on state management patterns

---

## See Also

- **Sending events from main** — understanding how to broadcast state changes
- **Integrating with event emitters** — coordinate state management with event buses
