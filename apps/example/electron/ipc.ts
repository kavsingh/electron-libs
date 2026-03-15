import EventEmitter from "node:events";

import {
	defineOperations,
	query,
	mutation,
	sendFromMain,
	sendFromRenderer,
} from "@kavsingh/electron-typed-ipc/main";

const emitter = new EventEmitter<{ acknowledge: [string] }>();

export const ipcDefinition = defineOperations({
	testQuery: query<string, undefined>(() => "query response"),

	testMutation: mutation<string, string>((_, input) => {
		return `mutation response (${input})`;
	}),

	testSendFromRenderer: sendFromRenderer<string>((_, message) => {
		emitter.emit("acknowledge", message);
	}),

	testSendFromMain: sendFromMain<string>(({ send }) => {
		function handler(message: string) {
			send({ payload: `event acknowledged (${message})` });
		}

		emitter.addListener("acknowledge", handler);

		return () => {
			emitter.removeListener("acknowledge", handler);
		};
	}),
});

export type AppIpcDefinitions = typeof ipcDefinition;
