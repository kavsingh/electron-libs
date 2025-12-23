import { ELECTRON_TYPED_IPC_GLOBAL_NAMESPACE } from "./internal.ts";

import type { IpcResult, Definition, Operation } from "./internal.ts";
import type { IpcPreloadApi } from "./preload.ts";
import type { IpcRenderer, IpcRendererEvent } from "electron";

const fnMocks: Record<string, (...args: unknown[]) => unknown> = {};
const eventHandlers: Record<
	string,
	Set<(event: IpcRendererEvent, payload: unknown) => void>
> = {};

async function mockInvoke(
	channel: string,
	payload: unknown,
): Promise<IpcResult> {
	const mock = fnMocks[channel];

	if (typeof mock !== "function") {
		throw new TypeError(`expected function mock for ${channel}`);
	}

	try {
		return { result: "ok", data: await mock(payload) };
	} catch (cause) {
		return { result: "error", error: cause };
	}
}

function mockSend(channel: string, payload: unknown) {
	const mock = fnMocks[channel];

	if (typeof mock !== "function") {
		throw new TypeError(`no mock for ${channel}`);
	}

	mock(payload);
}

export function getTypedIpcRendererMocks() {
	return { fnMocks, eventHandlers } as const;
}

export function mockTypedIpcRenderer<TDefinitions extends Definition>(
	mocks: TypedIpcMockRenderer<TDefinitions>,
) {
	const api: IpcPreloadApi = {
		query: mockInvoke,
		mutate: mockInvoke,
		send: mockSend,
		sendToHost: mockSend,
		subscribe: (
			channel: string,
			handler: (event: IpcRendererEvent, payload: unknown) => void,
		) => {
			if (eventHandlers[channel]) eventHandlers[channel].add(handler);
			else eventHandlers[channel] = new Set([handler]);

			return function unsubscribe() {
				if (eventHandlers[channel]) eventHandlers[channel].delete(handler);
			};
		},
	};

	applyTypedIpcMocks(mocks);

	return { api, namespace: ELECTRON_TYPED_IPC_GLOBAL_NAMESPACE };
}

export function applyTypedIpcMocks<TDefinitions extends Definition>(
	mocks: Partial<TypedIpcMockRenderer<TDefinitions>>,
) {
	for (const [channel, fn] of Object.entries(mocks)) {
		if (typeof fn !== "function") {
			throw new TypeError(
				`exepcted mock for ${channel} to be a function, got ${typeof fn}`,
			);
		}

		// @ts-expect-error look man i'm on a late night train leave me alone
		fnMocks[channel] = fn;
	}
}

export function typedIpcSendFromMain<
	TDefinitions extends Definition,
	TChannel extends SendableChannel<TDefinitions>,
>(
	channel: TChannel,
	payload: TDefinitions[TChannel] extends { operation: "sendFromMain" }
		? TDefinitions[TChannel]["payload"] extends undefined
			? undefined
			: TDefinitions[TChannel]["payload"]
		: never,
	event?: IpcRendererEvent,
) {
	// handlers are sets, only forEach available for iteration
	// oxlint-disable-next-line no-unsafe-type-assertion, no-array-for-each
	eventHandlers[channel as string]?.forEach((handler) => {
		handler(event ?? createMockIpcRendererEvent(), payload);
	});
}

const mockIpcRendererEventDefaults: IpcRendererEvent = {
	ports: [],
	// oxlint-disable-next-line no-unsafe-type-assertion
	sender: {} as IpcRenderer,
	preventDefault: () => undefined,
	defaultPrevented: false,
};

export function createMockIpcRendererEvent(
	transform?: (defaults: IpcRendererEvent) => IpcRendererEvent,
) {
	return transform
		? transform({ ...mockIpcRendererEventDefaults })
		: { ...mockIpcRendererEventDefaults };
}

export type TypedIpcMockRenderer<
	TDefinitions extends Definition,
	TMockableKey extends keyof TDefinitions = MockableChannel<TDefinitions>,
> = {
	[TKey in TMockableKey]: TDefinitions[TKey] extends {
		operation: "query" | "mutation";
	}
		? (
				input: TDefinitions[TKey]["input"],
			) => Promise<Awaited<TDefinitions[TKey]["response"]>>
		: TDefinitions[TKey] extends { operation: "sendFromRenderer" }
			? (arg: TDefinitions[TKey]["payload"]) => void | Promise<void>
			: never;
};

type MockableChannel<TDefinitions extends Definition> = ChannelForOperation<
	TDefinitions,
	"query" | "mutation" | "sendFromRenderer"
>;

type SendableChannel<TDefinitions extends Definition> = ChannelForOperation<
	TDefinitions,
	"sendFromMain"
>;

type ChannelForOperation<
	TDefinitions extends Definition,
	TOperation extends Operation["operation"],
> = Extract<
	{
		[TChannel in keyof TDefinitions]: {
			channel: TChannel;
			operation: TDefinitions[TChannel]["operation"];
		};
	}[keyof TDefinitions],
	{ operation: TOperation }
>["channel"];
