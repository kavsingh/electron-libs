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
import { app, BrowserWindow, protocol, net } from "electron";

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

protocol.registerSchemesAsPrivileged([{ scheme: "app" }]);

void app.whenReady().then(() => {
	protocol.handle("app", appProtocolHandler);

	const appWindow = new BrowserWindow({
		webPreferences: { preload: path.resolve(dirname, "preload.cjs") },
	});

	const disposeIpc = createIpcMain(ipcDefinition);

	if (!process.env["IS_E2E"]) appWindow.webContents.openDevTools();

	void appWindow.loadURL("app://bundle");

	app.on("quit", () => {
		disposeIpc();
	});
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
