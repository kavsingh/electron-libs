import { vi } from "vitest";

import type { BrowserWindow, IpcMain, IpcRenderer } from "electron";

// allow sparse mocks
// oxlint-disable no-unsafe-type-assertion, prefer-await-to-then

export function createMockIpcMain() {
	const mockIpcMain: Partial<IpcMain> = {
		handle: vi.fn(() => undefined),
		addListener: vi.fn(() => mockIpcMain as IpcMain),
		removeListener: vi.fn(() => mockIpcMain as IpcMain),
	};

	return mockIpcMain as IpcMain;
}

export function createMockIpcRenderer() {
	const mockIpcRenderer: Partial<IpcRenderer> = {
		invoke: vi.fn(() => Promise.resolve()),
		send: vi.fn(() => undefined),
		sendToHost: vi.fn(() => undefined),
		addListener: vi.fn(() => mockIpcRenderer as IpcRenderer),
		removeListener: vi.fn(() => mockIpcRenderer as IpcRenderer),
	};

	return mockIpcRenderer as IpcRenderer;
}

type BrowserWindowStatic = typeof BrowserWindow;

export function createMockBrowserWindow() {
	const mockBrowserWindow: Partial<BrowserWindowStatic> = {
		getAllWindows: vi.fn(() => []),
	};

	return mockBrowserWindow as BrowserWindowStatic;
}
