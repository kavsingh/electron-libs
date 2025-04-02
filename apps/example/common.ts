import {
	defineElectronTypedIpcSchema,
	query,
	sendFromMain,
} from "@kavsingh/electron-typed-ipc";

export const appIpcSchema = defineElectronTypedIpcSchema({
	ping: query<string, undefined>(),
	helloNow: sendFromMain<string>(),
} as const);

export type AppIpcSchema = typeof appIpcSchema;
