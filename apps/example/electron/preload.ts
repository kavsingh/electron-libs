import { exposeTypedIpc } from "@kavsingh/electron-typed-ipc/preload";
import { contextBridge, ipcRenderer } from "electron";

process.on("loaded", () => {
	contextBridge.exposeInMainWorld("isE2E", process.argv.includes("--e2e"));
	exposeTypedIpc({ ipcRenderer, logger: console }, (namespace, api) =>
		contextBridge.exposeInMainWorld(namespace, api),
	);
});
