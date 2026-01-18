import { BrowserWindow, ipcMain } from "electron";

import { exhaustive, scopeChannel } from "./internal.ts";
import { defaultSerializer } from "./serializer.ts";

import type {
	Definition,
	IpcResult,
	Mutation,
	Query,
	SendFromMain,
	SendFromRenderer,
	SendFromRendererImpl,
	SendFromMainImpl,
	DisposeFn,
	QueryImpl,
	MutationImpl,
} from "./internal.ts";
import type { Logger } from "./logger.ts";
import type { Serializer } from "./serializer.ts";
import type { IpcMainEvent, IpcMainInvokeEvent, WebContents } from "electron";

// support inference in consumers using typescript project references
export type {
	Definition,
	IpcResult,
	Mutation,
	Query,
	SendFromMain,
	SendFromRenderer,
	SendFromRendererImpl,
	SendFromMainImpl,
	DisposeFn,
	QueryImpl,
	MutationImpl,
};

export function query<TResponse, TInput>(
	impl: QueryImpl<TResponse, TInput>,
): Query<TResponse, TInput> {
	return {
		impl,
		operation: "query",
		// oxlint-disable-next-line no-unsafe-type-assertion
		input: undefined as TInput,
		// oxlint-disable-next-line no-unsafe-type-assertion
		response: undefined as TResponse,
	};
}

export function mutation<TResponse, TInput>(
	impl: MutationImpl<TResponse, TInput>,
): Mutation<TResponse, TInput> {
	return {
		impl,
		operation: "mutation",
		// oxlint-disable-next-line no-unsafe-type-assertion
		input: undefined as TInput,
		// oxlint-disable-next-line no-unsafe-type-assertion
		response: undefined as TResponse,
	};
}

export function sendFromMain<TPayload>(
	impl: SendFromMainImpl<TPayload>,
): SendFromMain<TPayload> {
	return {
		impl,
		operation: "sendFromMain",
		// oxlint-disable-next-line no-unsafe-type-assertion
		payload: undefined as TPayload,
	};
}

export function sendFromRenderer<TPayload>(
	impl: SendFromRendererImpl<TPayload>,
): SendFromRenderer<TPayload> {
	return {
		impl,
		operation: "sendFromRenderer",
		// oxlint-disable-next-line no-unsafe-type-assertion
		payload: undefined as TPayload,
	};
}

export function defineOperations<TDefinition extends Definition>(
	definition: TDefinition,
) {
	return definition;
}

// oxlint-disable-next-line max-lines-per-function, max-statements
export function createIpcMain(
	definition: Definition,
	options: CreateTypedIpcMainOptions = {},
): DisposeFn {
	const { logger, serializer = defaultSerializer } = options;
	const disposers: DisposeFn[] = [];

	function addHandler(
		operation: "query" | "mutation",
		channel: string,
		handler: (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown,
	) {
		const scopedChannel = scopeChannel(`${channel}/${operation}`);

		logger?.debug("add handler", operation, channel);

		ipcMain.handle(
			scopedChannel,
			async (event, input: unknown): Promise<IpcResult> => {
				logger?.debug("handle", operation, channel, input);

				try {
					const result: IpcResult = {
						result: "ok",
						data: await handler(event, serializer.deserialize(input)),
					};

					logger?.debug("handle result", operation, channel, result);

					return result;
				} catch (cause) {
					const error =
						cause instanceof Error ? cause : new Error(String(cause));
					const result: IpcResult = {
						result: "error",
						error: serializer.serialize(error),
					};

					logger?.debug("handle result", operation, channel, result);

					return result;
				}
			},
		);

		disposers.push(function removeHandler() {
			try {
				ipcMain.removeHandler(scopedChannel);
			} catch (cause) {
				logger?.warn(`failed to remove handler for ${channel}`, cause);
			}
		});
	}

	function sendToChannel(channel: string): SendPayloadToChannel {
		// oxlint-disable-next-line max-statements
		return function sendPayload(input) {
			logger?.debug("send", channel, input?.payload);

			const scopedChannel = scopeChannel(`${channel}/sendFromMain`);
			const targets = input?.targetWindows ?? BrowserWindow.getAllWindows();

			for (const target of targets) {
				if (target.isDestroyed()) continue;

				const serialized = serializer.serialize(input?.payload);

				if (input?.frames) {
					logger?.debug("send to frame", channel, input.frames, input.payload);
					target.webContents.sendToFrame(
						input.frames,
						scopedChannel,
						serialized,
					);
				} else {
					logger?.debug("send to window", channel, input?.payload);
					target.webContents.send(scopedChannel, serialized);
				}
			}
		};
	}

	function addSender(
		channel: string,
		senderFn: (senderApi: { send: SendPayloadToChannel }) => DisposeFn,
	) {
		logger?.debug("add sender", channel);

		const dispose = senderFn({ send: sendToChannel(channel) });

		disposers.push(function disposeSender() {
			logger?.debug("remove sender", channel);

			try {
				dispose();
			} catch (cause) {
				logger?.warn(`failed to remove sender for ${channel}`, cause);
			}
		});
	}

	function addSubscription(channel: string, subscriberFn: SubscribeToChannel) {
		logger?.debug("add subscription", channel);

		const scopedChannel = scopeChannel(`${channel}/sendFromRenderer`);

		function eventHandler(event: IpcMainEvent, payload: unknown) {
			logger?.debug("subscribe handler", { scopedChannel, payload });
			void subscriberFn(event, serializer.deserialize(payload));
		}

		logger?.debug("subscribe", { scopedChannel, eventHandler });
		ipcMain.addListener(scopedChannel, eventHandler);

		disposers.push(function removeListener() {
			logger?.debug("unsubscribe", { scopedChannel, eventHandler });

			try {
				ipcMain.removeListener(scopedChannel, eventHandler);
			} catch (cause) {
				logger?.warn(`failed to remove listener for ${channel}`, cause);
			}
		});
	}

	for (const [channel, def] of Object.entries(definition)) {
		const { impl, operation } = def;

		if (typeof impl !== "function") {
			logger?.warn(
				`could not setup ${channel} for ${operation}. expected a function, got ${typeof impl}`,
			);

			continue;
		}

		switch (operation) {
			case "query":
			case "mutation": {
				addHandler(operation, channel, impl);
				break;
			}

			case "sendFromMain": {
				addSender(channel, impl);
				break;
			}

			case "sendFromRenderer": {
				addSubscription(channel, impl);
				break;
			}

			default: {
				exhaustive(operation, logger);
				break;
			}
		}
	}

	return function dispose() {
		for (const disposeFn of disposers) disposeFn();
	};
}

export interface CreateTypedIpcMainOptions {
	serializer?: Serializer | undefined;
	logger?: Logger | undefined;
}

export interface SendFromMainOptions {
	frames?: Parameters<WebContents["sendToFrame"]>[0] | undefined;
	targetWindows?: BrowserWindow[] | undefined;
}

type SendPayloadToChannel = (input?: SendFromMainWithPayload) => void;

type SubscribeToChannel = (
	event: IpcMainEvent,
	payload?: unknown,
) => void | Promise<void>;

interface SendFromMainWithPayload<
	TPayload = unknown,
> extends SendFromMainOptions {
	payload: TPayload;
}
