export const ELECTRON_TYPED_IPC_GLOBAL_NAMESPACE = "__ELECTRON_TYPED_IPC__";

import type { Logger } from "./logger.ts";
import type {
	BrowserWindow,
	IpcMainEvent,
	IpcMainInvokeEvent,
	WebContents,
} from "electron";

const channelPrefix = "__tipc__/";

export function scopeChannel(channel: `${string}/${Operation["operation"]}`) {
	return `${channelPrefix}${channel}` as const;
}

export function isValidChannel(channel: string) {
	return channel.startsWith(channelPrefix);
}

export function exhaustive(param: never, logger?: Logger) {
	// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
	logger?.warn(`unknown value ${param}`);
}

export type Definition = Readonly<Record<string, Operation>>;

export type Operation = Query | Mutation | SendFromMain | SendFromRenderer;

export interface Query<TResponse = unknown, TInput = unknown> {
	operation: "query";
	input: TInput;
	response: TResponse;
	impl: AnyImpl;
}

export type QueryImpl<TResponse, TInput> = (
	event: IpcMainInvokeEvent,
	input: TInput,
) => TResponse | Promise<TResponse>;

export interface Mutation<TResponse = unknown, TInput = unknown> {
	operation: "mutation";
	input: TInput;
	response: TResponse;
	impl: AnyImpl;
}

export type MutationImpl<TResponse, TInput> = (
	event: IpcMainInvokeEvent,
	input: TInput,
) => TResponse | Promise<TResponse>;

export interface SendFromMain<TPayload = unknown> {
	operation: "sendFromMain";
	payload: TPayload;
	impl: AnyImpl;
}

export type SendFromMainImpl<TPayload> = (input: {
	send: (...args: SendFromMainArgs<TPayload>) => void;
}) => DisposeFn;

export type SendFromMainArgs<TPayload> = TPayload extends undefined
	? [input?: SendFromMainOptions]
	: [input: { payload: TPayload } & SendFromMainOptions];

export interface SendFromMainOptions {
	frames?: Parameters<WebContents["sendToFrame"]>[0] | undefined;
	targetWindows?: BrowserWindow[] | undefined;
}

export interface SendFromRenderer<TPayload = unknown> {
	operation: "sendFromRenderer";
	payload: TPayload;
	impl: AnyImpl;
}

export type SendFromRendererImpl<TPayload> = (
	event: IpcMainEvent,
	payload: TPayload,
) => void | Promise<void>;

export type SendFromRendererArgs<TPayload> = TPayload extends undefined
	? [input?: SendFromRendererOptions]
	: [input: { payload: TPayload } & SendFromRendererOptions];

export interface SendFromRendererOptions {
	toHost?: boolean | undefined;
}

export type DisposeFn = () => void;

export type IpcResult<TValue = unknown> =
	| { result: "ok"; data: TValue }
	| { result: "error"; error: unknown };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyImpl = (...args: any[]) => any;
