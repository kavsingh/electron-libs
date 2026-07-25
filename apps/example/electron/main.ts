import path from "node:path";
import url from "node:url";

import { createIpcMain } from "@kavsingh/electron-typed-ipc/main";
import { app, BrowserWindow, ipcMain, protocol, net } from "electron";

import { ipcDefinition } from "./ipc.ts";

import type { ValidateInvoker } from "@kavsingh/electron-typed-ipc/main";
import type { CustomScheme } from "electron";

const dirname = import.meta.dirname;
const isE2E = process.argv.includes("--e2e");
const appCustomScheme: CustomScheme = {
	scheme: "app",
	privileges: { corsEnabled: true },
};

type ValidateAppUrlResult =
	| { result: "valid"; url: URL }
	| { result: "invalid"; url: URL }
	| { result: "malformed" };

function validateAppUrl(candidate: string): ValidateAppUrlResult {
	const parsedUrl = URL.parse(candidate);

	if (!parsedUrl) return { result: "malformed" };

	const { protocol: parsedProtocol, host } = parsedUrl;

	return parsedProtocol === `${appCustomScheme.scheme}:` && host === "bundle"
		? { result: "valid", url: parsedUrl }
		: { result: "invalid", url: parsedUrl };
}

function appProtocolHandler(request: Request): Promise<Response> {
	const validation = validateAppUrl(request.url);

	if (validation.result === "malformed") {
		return Promise.resolve(
			new Response(`could not parse: ${request.url}`, {
				status: 400,
				headers: { "content-type": "text/html" },
			}),
		);
	}

	if (validation.result === "invalid") {
		return Promise.resolve(
			new Response("not found", {
				status: 400,
				headers: { "content-type": "text/html" },
			}),
		);
	}

	const { pathname } = validation.url;

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

const validateInvoker: ValidateInvoker<typeof ipcDefinition> = (event) => {
	const urlValidation = validateAppUrl(event.sender.getURL());

	if (urlValidation.result === "malformed") {
		return { valid: false, error: new Error("could not validate sender") };
	}

	return urlValidation.result === "valid"
		? { valid: true }
		: { valid: false, error: new Error("invalid sender") };
};

function init() {
	protocol.handle(appCustomScheme.scheme, appProtocolHandler);

	const appWindow = new BrowserWindow({
		webPreferences: {
			preload: path.resolve(dirname, "preload.cjs"),
			additionalArguments: isE2E ? ["--e2e"] : [],
		},
	});

	const disposeIpc = createIpcMain(ipcDefinition, {
		ipcMain,
		BrowserWindow,
		validateInvoker,
		logger: console,
	});

	if (!isE2E) appWindow.webContents.openDevTools();

	void appWindow.loadURL("app://bundle");

	app.on("quit", disposeIpc);
}

app.enableSandbox();
protocol.registerSchemesAsPrivileged([appCustomScheme]);
app.whenReady().then(init).catch(console.error);
