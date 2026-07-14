import { describe, it, expectTypeOf, expect } from "vitest";

import {
	defineOperations,
	mutation,
	query,
	sendFromMain,
	sendFromRenderer,
} from "./main.ts";
import { createIpcRenderer } from "./renderer.ts";

import type { SendFromRendererOptions } from "./renderer.ts";

type Stub<T> = (..._: unknown[]) => T;

interface SendFromMainPayload {
	type: "sendFromMain";
}

interface SendFromRendererPayload {
	type: "sendFromRenderer";
}

const stubUndefined: Stub<undefined> = () => undefined;
const stubString: Stub<string> = () => "hello";
const stubNumber: Stub<number> = () => 10;
const stubEvents: Stub<() => void> = () => () => undefined;

const _definition = defineOperations({
	queryVoidArgVoidReturn: query<undefined, undefined>(stubUndefined),
	queryVoidArgStringReturn: query<string, undefined>(stubString),
	queryNumberArgVoidReturn: query<undefined, number>(stubUndefined),
	queryStringArgNumberReturn: query<number, string>(stubNumber),

	mutationVoidArgVoidReturn: mutation<undefined, undefined>(stubUndefined),
	mutationVoidArgStringReturn: mutation<string, undefined>(stubString),
	mutationNumberArgVoidReturn: mutation<undefined, number>(stubUndefined),
	mutationStringArgNumberReturn: mutation<number, string>(stubNumber),

	sendVoidFromMain: sendFromMain<undefined>(stubEvents),
	sendPayloadFromMain: sendFromMain<SendFromMainPayload>(stubEvents),

	sendVoidFromRenderer: sendFromRenderer<undefined>(stubUndefined),
	sendPayloadFromRenderer:
		sendFromRenderer<SendFromRendererPayload>(stubUndefined),
});

const tipcRenderer = createIpcRenderer<typeof _definition>();

describe("renderer types", () => {
	describe("query operation", () => {
		it("should correctly type query without arg and void return", () => {
			expect.assertions(2);

			expectTypeOf(tipcRenderer.queryVoidArgVoidReturn.query).parameters
				.toEqualTypeOf<[]>;
			expectTypeOf(tipcRenderer.queryVoidArgVoidReturn.query).returns
				.toEqualTypeOf<Promise<undefined>>;
		});

		it("should correctly type query without arg and string return", () => {
			expect.assertions(2);

			expectTypeOf(tipcRenderer.queryVoidArgStringReturn.query).parameters
				.toEqualTypeOf<[]>;
			expectTypeOf(tipcRenderer.queryVoidArgStringReturn.query).returns
				.toEqualTypeOf<Promise<string>>;
		});

		it("should correctly type query with number arg and void return", () => {
			expect.assertions(2);

			expectTypeOf(tipcRenderer.queryNumberArgVoidReturn.query).parameters
				.toEqualTypeOf<[number]>;
			expectTypeOf(tipcRenderer.queryNumberArgVoidReturn.query).returns
				.toEqualTypeOf<Promise<undefined>>;
		});

		it("should correctly type query with string arg and number return", () => {
			expect.assertions(2);

			expectTypeOf(tipcRenderer.queryStringArgNumberReturn.query).parameters
				.toEqualTypeOf<[string]>;
			expectTypeOf(tipcRenderer.queryStringArgNumberReturn.query).returns
				.toEqualTypeOf<Promise<number>>;
		});
	});

	describe("mutate operation", () => {
		it("should correctly type mutation without arg and void return", () => {
			expect.assertions(2);

			expectTypeOf(tipcRenderer.mutationVoidArgVoidReturn.mutate).parameters
				.toExtend<[]>;
			expectTypeOf(tipcRenderer.mutationVoidArgVoidReturn.mutate).returns
				.toExtend<Promise<void>>;
		});

		it("should correctly type mutation without arg and string return", () => {
			expect.assertions(2);

			expectTypeOf(tipcRenderer.mutationVoidArgStringReturn.mutate).parameters
				.toExtend<[]>;
			expectTypeOf(tipcRenderer.mutationVoidArgStringReturn.mutate).returns
				.toExtend<Promise<string>>;
		});

		it("should correctly type mutation with number arg and void return", () => {
			expect.assertions(2);

			expectTypeOf(tipcRenderer.mutationNumberArgVoidReturn.mutate).parameters
				.toExtend<[number]>;
			expectTypeOf(tipcRenderer.mutationNumberArgVoidReturn.mutate).returns
				.toExtend<Promise<void>>;
		});

		it("should correctly type mutation with string arg and number return", () => {
			expect.assertions(2);

			expectTypeOf(tipcRenderer.mutationStringArgNumberReturn.mutate).parameters
				.toExtend<[string]>;
			expectTypeOf(tipcRenderer.mutationStringArgNumberReturn.mutate).returns
				.toExtend<Promise<number>>;
		});
	});

	describe("subscribe operation", () => {
		it("should correctly type send from main without payload", () => {
			expect.assertions(2);

			expectTypeOf(tipcRenderer.sendVoidFromMain.subscribe).parameter(0)
				.parameters.toEqualTypeOf<[]>;
			expectTypeOf(tipcRenderer.sendVoidFromMain.subscribe).parameter(0).returns
				.toExtend<void | Promise<void>>;
			expectTypeOf(
				tipcRenderer.sendVoidFromMain.subscribe,
			).returns.toBeFunction();
		});

		it("should correctly type send from main with payload", () => {
			expect.assertions(2);

			expectTypeOf(tipcRenderer.sendPayloadFromMain.subscribe).parameter(0)
				.parameters.toEqualTypeOf<[SendFromMainPayload]>;
			expectTypeOf(tipcRenderer.sendPayloadFromMain.subscribe).parameter(0)
				.returns.toEqualTypeOf<void | Promise<void>>;
			expectTypeOf(
				tipcRenderer.sendPayloadFromMain.subscribe,
			).returns.toBeFunction();
		});
	});

	describe("send operation", () => {
		it("should correctly type send from renderer without payload", () => {
			expect.assertions(2);

			expectTypeOf(tipcRenderer.sendVoidFromRenderer.send).parameters
				.toEqualTypeOf<[SendFromRendererOptions | undefined]>;
			expectTypeOf(tipcRenderer.sendVoidFromRenderer.send).returns.toBeVoid();
		});

		it("should correctly type send from renderer with payload", () => {
			expect.assertions(2);

			expectTypeOf(tipcRenderer.sendPayloadFromRenderer.send).parameters
				.toEqualTypeOf<
				[SendFromRendererPayload, SendFromRendererOptions | undefined]
			>;
			expectTypeOf(
				tipcRenderer.sendPayloadFromRenderer.send,
			).returns.toBeVoid();
		});
	});
});
