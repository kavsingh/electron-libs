import EventEmitter from "node:events";
import { setTimeout } from "node:timers/promises";

import {
	defineOperations,
	query,
	mutation,
	sendFromMain,
	sendFromRenderer,
} from "@kavsingh/electron-typed-ipc/main";

const emitter = new EventEmitter<{ acknowledge: [string] }>();

export const ipcDefinition = defineOperations({
	testQuery: query<string, undefined>(async () => {
		await setTimeout(1_000);

		return "query response";
	}),

	testMutation: mutation<string, string>(async (_, input) => {
		await setTimeout(1_000);

		return `mutation response (${input})`;
	}),

	testSendFromRenderer: sendFromRenderer<string>((_, message) => {
		void setTimeout(500).then(() => {
			emitter.emit("acknowledge", message);
		});
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
