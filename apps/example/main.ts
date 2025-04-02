import path from "node:path";
import url from "node:url";

import { createElectronTypedIpcMain } from "@kavsingh/electron-typed-ipc/main";
import { app, BrowserWindow, ipcMain } from "electron";

import type { AppIpcSchema } from "./common.ts";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));
const tipc = createElectronTypedIpcMain<AppIpcSchema>(ipcMain);

void app.whenReady().then(() => {
	const appWindow = new BrowserWindow({
		webPreferences: { preload: path.resolve(dirname, "preload.cjs") },
	});

	const pongDisposer = tipc.ping.handleQuery(() => "pong");

	if (!process.env["IS_E2E"]) appWindow.webContents.openDevTools();
	void appWindow.loadFile(path.resolve(dirname, "app.html"));

	const helloInterval = setInterval(() => {
		tipc.helloNow.send(`hello now: ${Date.now()}`);
	}, 500);

	app.on("quit", () => {
		clearInterval(helloInterval);
		pongDisposer();
	});
});
