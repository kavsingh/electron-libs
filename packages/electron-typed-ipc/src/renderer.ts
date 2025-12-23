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

// oxlint-disable-next-line max-lines-per-function, max-statements
export function createIpcRenderer<TDefinition extends Definition>(options?: {
	serializer?: Serializer | undefined;
	logger?: Logger | undefined;
}) {
	let preloadApi: IpcPreloadApi | undefined = undefined;

	if (ELECTRON_TYPED_IPC_GLOBAL_NAMESPACE in globalThis.window) {
		// oxlint-disable-next-line no-unsafe-type-assertion
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
	// oxlint-disable-next-line no-unsafe-type-assertion
	const proxyObj = {} as ElectronTypedIpcRenderer<TDefinition>;
	// oxlint-disable-next-line func-style, consistent-function-scoping
	const proxyFn = () => undefined;

	function queryProxy(api: IpcPreloadApi, channel: string) {
		return new Proxy(proxyFn, {
			apply: async (_, __, [arg]: [unknown]) => {
				logger?.debug("query", { channel, arg });

				// oxlint-disable-next-line no-unsafe-type-assertion
				const response = (await api.query(
					channel,
					arg ? serializer.serialize(arg) : undefined,
				)) as IpcResult;

				logger?.debug("query result", {
					channel,
					response,
				});

				if (response.result === "error") {
					throw serializer.deserialize(response.error);
				}

				return serializer.deserialize(response.data);
			},
		});
	}

	function mutationProxy(api: IpcPreloadApi, channel: string) {
		return new Proxy(proxyFn, {
			apply: async (_, __, [arg]: [unknown]) => {
				logger?.debug("mutation", { channel, arg });

				// oxlint-disable-next-line no-unsafe-type-assertion
				const response = (await api.mutate(
					channel,
					arg ? serializer.serialize(arg) : undefined,
				)) as IpcResult;

				logger?.debug("mutation result", { channel, response });

				if (response.result === "error") {
					throw serializer.deserialize(response.error);
				}

				return serializer.deserialize(response.data);
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

					void handler(event, serializer.deserialize(payload));
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
