import type {
	DefineElectronTypedIpcSchema,
	Query,
} from "@kavsingh/electron-typed-ipc";

export type AppIpcSchema = DefineElectronTypedIpcSchema<{
	ping: Query<string>;
}>;
