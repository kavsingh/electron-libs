import { vi } from "vitest";

import type { BrowserWindow, IpcMain, IpcRenderer } from "electron";

type BrowserWindowStatic = typeof BrowserWindow;

// allow sparse mocks
// oxlint-disable typescript/no-unsafe-type-assertion

function createMockIpcMain() {
	const mockIpcMain: Partial<IpcMain> = {
		handle: vi.fn(() => undefined),
		addListener: vi.fn(() => mockIpcMain as IpcMain),
		removeListener: vi.fn(() => mockIpcMain as IpcMain),
	};

	return mockIpcMain as IpcMain;
}

function createMockIpcRenderer() {
	const mockIpcRenderer: Partial<IpcRenderer> = {
		invoke: vi.fn(() => Promise.resolve()),
		send: vi.fn(() => undefined),
		sendToHost: vi.fn(() => undefined),
		addListener: vi.fn(() => mockIpcRenderer as IpcRenderer),
		removeListener: vi.fn(() => mockIpcRenderer as IpcRenderer),
	};

	return mockIpcRenderer as IpcRenderer;
}

function createMockBrowserWindow() {
	const mockBrowserWindow: Partial<BrowserWindowStatic> = {
		getAllWindows: vi.fn(() => []),
	};

	return mockBrowserWindow as BrowserWindowStatic;
}

export { createMockIpcMain, createMockIpcRenderer, createMockBrowserWindow };
