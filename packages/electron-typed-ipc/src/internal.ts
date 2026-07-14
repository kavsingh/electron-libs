import type { Logger } from "./logger.ts";
import type {
	BrowserWindow,
	IpcMainEvent,
	IpcMainInvokeEvent,
	WebContents,
} from "electron";

const ELECTRON_TYPED_IPC_GLOBAL_NAMESPACE = "__ELECTRON_TYPED_IPC__";
const channelPrefix = "__tipc__/";

function scopeChannel<TChannel extends `${string}/${Operation["operation"]}`>(
	channel: TChannel,
): `${typeof channelPrefix}${TChannel}` {
	return `${channelPrefix}${channel}`;
}

function isValidChannel(channel: string): boolean {
	return channel.startsWith(channelPrefix);
}

function exhaustive(param: never, logger?: Logger): void {
	// oxlint-disable-next-line typescript/restrict-template-expressions
	logger?.warn(`unknown value ${param}`);
}

// oxlint-disable-next-line typescript/no-explicit-any
type AnyImpl = (...args: any[]) => any;

type Definition = Readonly<Record<string, Operation>>;

type Operation = Query | Mutation | SendFromMain | SendFromRenderer;

interface Query<TResponse = unknown, TInput = unknown> {
	operation: "query";
	input: TInput;
	response: TResponse;
	impl: AnyImpl;
}

type QueryImpl<TResponse, TInput> = (
	event: IpcMainInvokeEvent,
	input: TInput,
) => TResponse | Promise<TResponse>;

interface Mutation<TResponse = unknown, TInput = unknown> {
	operation: "mutation";
	input: TInput;
	response: TResponse;
	impl: AnyImpl;
}

type MutationImpl<TResponse, TInput> = (
	event: IpcMainInvokeEvent,
	input: TInput,
) => TResponse | Promise<TResponse>;

interface SendFromMain<TPayload = unknown> {
	operation: "sendFromMain";
	payload: TPayload;
	impl: AnyImpl;
}

type SendFromMainImpl<TPayload> = (input: {
	send: (...args: SendFromMainArgs<TPayload>) => void;
}) => DisposeFn;

type SendFromMainArgs<TPayload> = TPayload extends undefined
	? [input?: SendFromMainOptions]
	: [input: { payload: TPayload } & SendFromMainOptions];

interface SendFromMainOptions {
	frames?: Parameters<WebContents["sendToFrame"]>[0] | undefined;
	targetWindows?: BrowserWindow[] | undefined;
}

interface SendFromRenderer<TPayload = unknown> {
	operation: "sendFromRenderer";
	payload: TPayload;
	impl: AnyImpl;
}

type SendFromRendererImpl<TPayload> = (
	event: IpcMainEvent,
	payload: TPayload,
) => void | Promise<void>;

type SendFromRendererArgs<TPayload> = TPayload extends undefined
	? [input?: SendFromRendererOptions]
	: [input: { payload: TPayload } & SendFromRendererOptions];

interface SendFromRendererOptions {
	toHost?: boolean | undefined;
}

type DisposeFn = () => void;

type IpcResult<TValue = unknown> =
	| { result: "ok"; data: TValue }
	| { result: "error"; error: unknown };

export {
	ELECTRON_TYPED_IPC_GLOBAL_NAMESPACE,
	scopeChannel,
	isValidChannel,
	exhaustive,
};

export type {
	Definition,
	Operation,
	Query,
	QueryImpl,
	Mutation,
	MutationImpl,
	SendFromMain,
	SendFromMainImpl,
	SendFromMainArgs,
	SendFromMainOptions,
	SendFromRenderer,
	SendFromRendererImpl,
	SendFromRendererArgs,
	SendFromRendererOptions,
	DisposeFn,
	IpcResult,
};
