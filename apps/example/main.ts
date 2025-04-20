import EventEmitter from "node:events";
import path from "node:path";
import url from "node:url";

import {
	defineOperations,
	createIpcMain,
	query,
	sendFromMain,
	sendFromRenderer,
} from "@kavsingh/electron-typed-ipc/main";
import { app, BrowserWindow } from "electron";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));
const emitter = new EventEmitter<{ ping: [string] }>();

const ipcDefinition = defineOperations({
	req: query<string, undefined>(() => "res"),

	pong: sendFromMain<string>(({ send }) => {
		emitter.on("ping", (message) => {
			send({ payload: `pong (${message})` });
		});

		return () => {
			emitter.removeAllListeners("ping");
		};
	}),

	ping: sendFromRenderer<string>((_, message) => {
		emitter.emit("ping", message);
	}),
});

export type AppIpcDefinitions = typeof ipcDefinition;

void app.whenReady().then(() => {
	const appWindow = new BrowserWindow({
		webPreferences: { preload: path.resolve(dirname, "preload.cjs") },
	});

	const disposeIpc = createIpcMain(ipcDefinition);

	if (!process.env["IS_E2E"]) appWindow.webContents.openDevTools();
	void appWindow.loadFile(path.resolve(dirname, "app.html"));

	app.on("quit", () => {
		disposeIpc();
	});
});
