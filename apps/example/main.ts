import path from "node:path";
import url from "node:url";

import { createElectronTypedIpcMain } from "@kavsingh/electron-typed-ipc/main";
import { app, BrowserWindow, ipcMain } from "electron";

import { appIpcSchema } from "./common.ts";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));
const tipc = createElectronTypedIpcMain(appIpcSchema, ipcMain);

void app.whenReady().then(() => {
	const appWindow = new BrowserWindow({
		webPreferences: { preload: path.resolve(dirname, "preload.cjs") },
	});

	const disposeIpc = tipc.ipcHandleAndSend({
		ping: () => "pong",

		helloNow: (send) => {
			const helloInterval = setInterval(() => {
				send({ payload: `hello now: ${Date.now()}` });
			}, 500);

			return () => {
				clearInterval(helloInterval);
			};
		},
	});

	if (!process.env["IS_E2E"]) appWindow.webContents.openDevTools();
	void appWindow.loadFile(path.resolve(dirname, "app.html"));

	app.on("quit", () => {
		disposeIpc();
	});
});
