import { contextBridge } from "electron";

const api = {
	ping: () => "pong",
};

process.on("loaded", () => {
	contextBridge.exposeInMainWorld("api", api);
});

declare global {
	interface Window {
		api: typeof api;
	}
}
