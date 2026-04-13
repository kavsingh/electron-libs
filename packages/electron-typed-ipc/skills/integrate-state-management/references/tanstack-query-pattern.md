import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";
import type { AppIpcDefinitions } from "~/electron/ipc";

const tipc = createIpcRenderer<AppIpcDefinitions>();
const queryClient = useQueryClient();

/\*\*

- TanStack Query Pattern with electron-typed-ipc
  \*/

// Query hook
export function useGetUser(userId: string) {
return useQuery({
queryKey: ["user", userId],
queryFn: () => tipc.getUser.query({ userId }),
staleTime: 1000 _ 60 _ 5, // 5 minutes
});
}

// Mutation hook with cache invalidation
export function useUpdateUser() {
return useMutation({
mutationFn: (input: { id: string; name: string }) =>
tipc.updateUser.mutate(input),
onSuccess: (data, input) => {
queryClient.invalidateQueries({ queryKey: ["user", input.id] });
},
});
}

// Subscribe to IPC events for cache updates
export function useUserUpdatesSubscription() {
useEffect(() => {
const unsub = tipc.userUpdated.subscribe((event, user) => {
// Update cache when IPC event arrives
queryClient.setQueryData(["user", user.id], user);
});

    return unsub;

}, []);
}

// Use in component
export function UserProfile({ userId }: { userId: string }) {
const { data: user, isLoading } = useGetUser(userId);
const updateUserMutation = useUpdateUser();
useUserUpdatesSubscription();

if (isLoading) return <div>Loading...</div>;

return (

<div>
<h1>{user?.name}</h1>
<button onClick={() => updateUserMutation.mutate({ id: userId, name: "Updated" })}>
Update
</button>
</div>
);
}
