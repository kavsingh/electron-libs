import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { createIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";
import type { AppIpcDefinitions } from "~/electron/ipc";

const tipc = createIpcRenderer<AppIpcDefinitions>();

/\*\*

- Redux Toolkit (RTK Query) Pattern with electron-typed-ipc
  \*/

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
providesTags: (result, error, userId) => [
{ type: "User" as const, id: userId },
],
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
        { type: "User" as const, id: input.id },
      ],
    }),

}),
});

// Hook to sync IPC events with Redux cache
export function useUserEventsSync() {
const dispatch = useDispatch();

useEffect(() => {
const unsub = tipc.userUpdated.subscribe((event, user) => {
// Manually update cache when IPC event arrives
dispatch(
userApi.util.updateQueryData("getUser", user.id, (draft) => {
Object.assign(draft, user);
})
);
});

    return unsub;

}, [dispatch]);
}

// Use in component
import { useGetUserQuery, useUpdateUserMutation } from "./userApi";

export function UserProfile({ userId }: { userId: string }) {
const { data: user, isLoading } = useGetUser(userId);
const [updateUser] = useUpdateUserMutation();
useUserEventsSync();

if (isLoading) return <div>Loading...</div>;

return (

<div>
<h1>{user?.name}</h1>
<button onClick={() => updateUser({ id: userId, name: "Updated" })}>
Update
</button>
</div>
);
}
