import path from "node:path";
import url from "node:url";

import { app, BrowserWindow } from "electron";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

void app.whenReady().then(() => {
	const appWindow = new BrowserWindow({
		webPreferences: { preload: path.resolve(dirname, "preload.cjs") },
	});

	if (!process.env["IS_E2E"]) appWindow.webContents.openDevTools();
	void appWindow.loadFile(path.resolve(dirname, "app.html"));
});
