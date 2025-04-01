import path from "node:path";
import url from "node:url";

import { createElectronTypedIpcMain } from "@kavsingh/electron-typed-ipc/main";
import { app, BrowserWindow, protocol, net, ipcMain } from "electron";

import type { AppIpcSchema } from "./common.ts";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));
const tipc = createElectronTypedIpcMain<AppIpcSchema>(ipcMain);

protocol.registerSchemesAsPrivileged([{ scheme: "app" }]);

void app.whenReady().then(() => {
	protocol.handle("app", appProtocolHandler);

	const appWindow = new BrowserWindow({
		webPreferences: { preload: path.resolve(dirname, "preload.cjs") },
	});

	tipc.ping.handleQuery(() => "pong");

	if (!process.env["IS_E2E"]) appWindow.webContents.openDevTools();

	void appWindow.loadURL("app://bundle");
});

async function appProtocolHandler(request: Request): Promise<Response> {
	const { host, pathname } = new URL(request.url);

	if (host !== "bundle") {
		return new Response("not found", {
			status: 400,
			headers: { "content-type": "text/html" },
		});
	}

	const pathToServe = path.resolve(
		dirname,
		pathname.replace(/^\//, "") || "app.html",
	);
	const relativePath = path.relative(dirname, pathToServe);
	const isSafe =
		relativePath &&
		!relativePath.startsWith("..") &&
		!path.isAbsolute(relativePath);

	if (!isSafe) {
		return new Response(`unsafe path: ${pathname}`, {
			status: 400,
			headers: { "content-type": "text/html" },
		});
	}

	return net.fetch(url.pathToFileURL(pathToServe).href);
}
