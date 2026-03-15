import { DEVTOOLS_EVENT_BUS_NAME } from "electron-typed-ipc-shared/devtools.ts";

import { ELECTRON_TYPED_IPC_GLOBAL_NAMESPACE } from "./internal.ts";
import { defaultSerializer } from "./serializer.ts";

import type {
	IpcResult,
	DisposeFn,
	Query,
	Mutation,
	SendFromRenderer,
	SendFromMain,
	Definition,
} from "./internal.ts";
import type { Logger } from "./logger.ts";
import type { IpcPreloadApi } from "./preload.ts";
import type { Serializer } from "./serializer.ts";
import type { IpcRendererEvent } from "electron";
import type {
	DevtoolsEventBus,
	DevtoolsEvent,
} from "electron-typed-ipc-shared/devtools.ts";

// support inference in consumers using typescript project references
export type {
	IpcResult,
	DisposeFn,
	Query,
	Mutation,
	SendFromRenderer,
	SendFromMain,
	Definition,
};

function getDebugId(): string {
	return Math.random().toString(36).slice(2);
}

function publishDevtoolsEvent(event: DevtoolsEvent): void {
	// @ts-expect-error isolate type
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	const eventBus = globalThis.window[DEVTOOLS_EVENT_BUS_NAME] as
		| DevtoolsEventBus
		| undefined;

	eventBus?.publish(event);
}

export function createIpcRenderer<TDefinition extends Definition>(options?: {
	serializer?: Serializer | undefined;
	logger?: Logger | undefined;
}) {
	let preloadApi: IpcPreloadApi | undefined = undefined;

	if (ELECTRON_TYPED_IPC_GLOBAL_NAMESPACE in globalThis.window) {
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion
		preloadApi = globalThis.window[
			ELECTRON_TYPED_IPC_GLOBAL_NAMESPACE
		] as IpcPreloadApi;
	}

	if (!preloadApi) {
		throw new Error(
			`object named ${ELECTRON_TYPED_IPC_GLOBAL_NAMESPACE} not found on window`,
		);
	}

	const serializer = options?.serializer ?? defaultSerializer;
	const logger = options?.logger;
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion, typescript/consistent-type-assertions
	const proxyObj = {} as ElectronTypedIpcRenderer<TDefinition>;
	// oxlint-disable-next-line unicorn/consistent-function-scoping
	const proxyFn = () => undefined;

	function queryProxy(api: IpcPreloadApi, channel: string) {
		return new Proxy(proxyFn, {
			apply: async (_, __, [arg]: [unknown]) => {
				logger?.debug("query", { channel, arg });

				const id = getDebugId();

				publishDevtoolsEvent({
					id,
					channel,
					type: "queryStarted",
					input: arg,
					timestamp: Date.now(),
				});

				// oxlint-disable-next-line typescript/no-unsafe-type-assertion
				const response = (await api.query(
					channel,
					arg ? serializer.serialize(arg) : undefined,
				)) as IpcResult;

				logger?.debug("query result", {
					channel,
					response,
				});

				if (response.result === "error") {
					const deserialized = serializer.deserialize(response.error);

					publishDevtoolsEvent({
						id,
						channel,
						type: "queryResolved",
						result: { type: "error", cause: deserialized },
						timestamp: Date.now(),
					});

					throw deserialized;
				}

				const deserialized = serializer.deserialize(response.data);

				publishDevtoolsEvent({
					id,
					channel,
					type: "queryResolved",
					result: { type: "success", response: deserialized },
					timestamp: Date.now(),
				});

				return deserialized;
			},
		});
	}

	function mutationProxy(api: IpcPreloadApi, channel: string) {
		return new Proxy(proxyFn, {
			apply: async (_, __, [arg]: [unknown]) => {
				logger?.debug("mutation", { channel, arg });

				const id = getDebugId();

				publishDevtoolsEvent({
					id,
					channel,
					type: "mutationStarted",
					input: arg,
					timestamp: Date.now(),
				});

				// oxlint-disable-next-line typescript/no-unsafe-type-assertion
				const response = (await api.mutate(
					channel,
					arg ? serializer.serialize(arg) : undefined,
				)) as IpcResult;

				logger?.debug("mutation result", { channel, response });

				if (response.result === "error") {
					const deserialized = serializer.deserialize(response.error);

					publishDevtoolsEvent({
						id,
						channel,
						type: "mutationResolved",
						result: { type: "error", cause: deserialized },
						timestamp: Date.now(),
					});

					throw deserialized;
				}

				const deserialized = serializer.deserialize(response.data);

				publishDevtoolsEvent({
					id,
					channel,
					type: "mutationResolved",
					result: { type: "success", response: deserialized },
					timestamp: Date.now(),
				});

				return deserialized;
			},
		});
	}

	function sendProxy(api: IpcPreloadApi, channel: string) {
		return new Proxy(proxyFn, {
			apply: (
				_,
				__,
				[payload, sendOptions]: [unknown, SendFromRendererOptions | undefined],
			) => {
				const serialized = serializer.serialize(payload);

				logger?.debug("send", {
					channel,
					payload: serialized,
					sendOptions,
				});

				if (sendOptions?.toHost) api.sendToHost(channel, serialized);
				else api.send(channel, serialized);

				publishDevtoolsEvent({
					channel,
					payload,
					type: "sendFromRenderer",
					timestamp: Date.now(),
				});
			},
		});
	}

	function subscribeProxy(api: IpcPreloadApi, channel: string) {
		return new Proxy(proxyFn, {
			apply: (__, ___, [handler]: [(...args: unknown[]) => unknown]) => {
				return api.subscribe(channel, (event, payload) => {
					logger?.debug("subscribe receive", {
						channel,
						payload,
						handler,
					});

					const deserialized = serializer.deserialize(payload);

					publishDevtoolsEvent({
						channel,
						payload: deserialized,
						type: "sendFromMain",
						timestamp: Date.now(),
					});

					void handler(event, deserialized);
				});
			},
		});
	}

	function operationsProxy(api: IpcPreloadApi, channel: string) {
		return new Proxy(proxyObj, {
			get: (_, operation) => {
				if (typeof operation !== "string") return undefined;

				switch (operation) {
					case "query": {
						return queryProxy(api, channel);
					}

					case "mutate": {
						return mutationProxy(api, channel);
					}

					case "send": {
						return sendProxy(api, channel);
					}

					case "subscribe": {
						return subscribeProxy(api, channel);
					}

					default: {
						logger?.warn(`unknown operation ${operation}`);

						return undefined;
					}
				}
			},
		});
	}

	return new Proxy(proxyObj, {
		get: (_, channel) => {
			if (typeof channel !== "string") return undefined;

			return operationsProxy(preloadApi, channel);
		},
	});
}

type ElectronTypedIpcRenderer<TDefinition extends Definition> = Readonly<{
	[TName in keyof TDefinition]: TDefinition[TName] extends Query
		? {
				query: (
					...args: TDefinition[TName]["input"] extends undefined
						? []
						: [input: TDefinition[TName]["input"]]
				) => Promise<TDefinition[TName]["response"]>;
			}
		: TDefinition[TName] extends Mutation
			? {
					mutate: (
						...args: TDefinition[TName]["input"] extends undefined
							? []
							: [input: TDefinition[TName]["input"]]
					) => Promise<TDefinition[TName]["response"]>;
				}
			: TDefinition[TName] extends SendFromRenderer
				? {
						send: (
							...args: TDefinition[TName]["payload"] extends undefined
								? [options?: SendFromRendererOptions]
								: [
										payload: TDefinition[TName]["payload"],
										options?: SendFromRendererOptions,
									]
						) => void;
					}
				: TDefinition[TName] extends SendFromMain
					? {
							subscribe: (
								listener: (
									...args: TDefinition[TName]["payload"] extends undefined
										? [event: IpcRendererEvent]
										: [
												event: IpcRendererEvent,
												payload: TDefinition[TName]["payload"],
											]
								) => void | Promise<void>,
							) => DisposeFn;
						}
					: never;
}>;

export interface SendFromRendererOptions {
	toHost?: boolean | undefined;
}
