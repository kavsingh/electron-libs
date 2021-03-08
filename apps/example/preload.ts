import { contextBridge } from "electron";

const api = {
	ping: () => "pong",
};

process.on("loaded", () => {
	contextBridge.exposeInMainWorld("api", api);
});

declare global {
	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
	interface Window {
		api: typeof api;
	}
}
