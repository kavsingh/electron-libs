import { exposeTypedIpc } from "@kavsingh/electron-typed-ipc/preload";

process.on("loaded", exposeTypedIpc);
