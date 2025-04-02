import {
	defineElectronTypedIpcSchema,
	query,
} from "@kavsingh/electron-typed-ipc";

export const appIpcSchema = defineElectronTypedIpcSchema({
	ping: query<string, undefined>(),
} as const);

export type AppIpcSchema = typeof appIpcSchema;
