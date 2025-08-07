import path from "node:path";
import url from "node:url";

import { app, BrowserWindow, protocol, net } from "electron";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

protocol.registerSchemesAsPrivileged([{ scheme: "app" }]);

void app.whenReady().then(() => {
	protocol.handle("app", appProtocolHandler);

	const appWindow = new BrowserWindow({
		webPreferences: { preload: path.resolve(dirname, "preload.cjs") },
	});

	if (!process.env["IS_E2E"]) appWindow.webContents.openDevTools();
	void appWindow.loadURL("app://dist/app.html");
});

async function appProtocolHandler(request: Request): Promise<Response> {
	const { host, pathname } = new URL(request.url);

	if (host !== "dist") {
		return new Response("not found", {
			status: 400,
			headers: { "content-type": "text/html" },
		});
	}

	const pathToServe = path.resolve(dirname, pathname.replace(/^\//, ""));
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
