import { vi } from "vitest";

import type { BrowserWindow, IpcMain, IpcRenderer } from "electron";

export function createMockIpcMain() {
	// oxlint-disable-next-line no-unsafe-type-assertion
	const mockIpcMain = {
		handle: vi.fn(() => undefined),
		addListener: vi.fn(() => mockIpcMain),
		removeListener: vi.fn(() => mockIpcMain),
	} as unknown as IpcMain;
}

export function createMockIpcRenderer() {
	// oxlint-disable-next-line no-unsafe-type-assertion
	const mockIpcRenderer = {
		// oxlint-disable-next-line catch-or-return, prefer-await-to-then
		invoke: vi.fn(() => Promise.resolve()),
		send: vi.fn(() => undefined),
		sendToHost: vi.fn(() => undefined),
		addListener: vi.fn(() => mockIpcRenderer),
		removeListener: vi.fn(() => mockIpcRenderer),
	} as unknown as IpcRenderer;
}

export function createMockBrowserWindow() {
	// oxlint-disable-next-line no-unsafe-type-assertion
	return {
		getAllWindows: vi.fn(() => []),
	} as unknown as typeof BrowserWindow;
}
