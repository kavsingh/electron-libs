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

const { dirname } = import.meta;
const emitter = new EventEmitter<{ "renderer/ping": [string] }>();

const ipcDefinition = defineOperations({
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

protocol.registerSchemesAsPrivileged([{ scheme: "app" }]);
// oxlint-disable-next-line prefer-top-level-await
void init();

async function init() {
	await app.whenReady();

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
}

// oxlint-disable-next-line max-statements
function appProtocolHandler(request: Request): Promise<Response> {
	const requestUrl = URL.parse(request.url);

	if (!requestUrl) {
		return Promise.resolve(
			new Response(`could not parse: ${request.url}`, {
				status: 400,
				headers: { "content-type": "text/html" },
			}),
		);
	}

	const { host, pathname } = requestUrl;

	if (host !== "bundle") {
		return Promise.resolve(
			new Response("not found", {
				status: 400,
				headers: { "content-type": "text/html" },
			}),
		);
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
		return Promise.resolve(
			new Response(`unsafe path: ${pathname}`, {
				status: 400,
				headers: { "content-type": "text/html" },
			}),
		);
	}

	return net.fetch(url.pathToFileURL(pathToServe).href);
}
