import { vi } from "vitest";

import {
	createMockIpcMain,
	createMockIpcRenderer,
	createMockBrowserWindow,
} from "./__test__/mocks.ts";

vi.mock("electron", () => ({
	ipcMain: createMockIpcMain(),
	ipcRenderer: createMockIpcRenderer(),
	BrowserWindow: createMockBrowserWindow(),
}));
