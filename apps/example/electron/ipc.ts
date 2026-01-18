import EventEmitter from "node:events";

import {
	defineOperations,
	query,
	sendFromMain,
	sendFromRenderer,
} from "@kavsingh/electron-typed-ipc/main";

const emitter = new EventEmitter<{ "renderer/ping": [string] }>();

export const ipcDefinition = defineOperations({
	req: query<string, undefined>(() => "res"),

	ping: sendFromRenderer<string>((_, message) => {
		emitter.emit("renderer/ping", message);
	}),

	pong: sendFromMain<string>(({ send }) => {
		function handler(message: string) {
			send({ payload: `pong (${message})` });
		}

		emitter.addListener("renderer/ping", handler);

		return () => {
			emitter.removeListener("renderer/ping", handler);
		};
	}),
});

export type AppIpcDefinitions = typeof ipcDefinition;
