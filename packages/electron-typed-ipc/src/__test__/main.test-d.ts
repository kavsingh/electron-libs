import { describe, it, expectTypeOf, expect } from "vitest";

import { mutation, query, sendFromMain, sendFromRenderer } from "../main.ts";

import type { BrowserWindow, IpcMainEvent } from "electron";

describe("main types", () => {
	describe("requests", () => {
		it("should type query handler", () => {
			expect.assertions(4);

			expectTypeOf(query<undefined, undefined>).parameter(0).toExtend<
				(event: IpcMainEvent, input: undefined) => void | Promise<void>
			>;
			expectTypeOf(query<string, undefined>).parameter(0).toExtend<
				(event: IpcMainEvent, input: undefined) => string | Promise<string>
			>;
			expectTypeOf(query<undefined, number>).parameter(0).toExtend<
				(event: IpcMainEvent, input: number) => void | Promise<void>
			>;
			expectTypeOf(query<string, number>).parameter(0).toExtend<
				(event: IpcMainEvent, input: number) => string | Promise<string>
			>;
		});

		it("should type mutation handler", () => {
			expect.assertions(4);

			expectTypeOf(mutation<undefined, undefined>).parameter(0).toExtend<
				(event: IpcMainEvent, input: undefined) => void | Promise<void>
			>;
			expectTypeOf(mutation<string, undefined>).parameter(0).toExtend<
				(event: IpcMainEvent, input: undefined) => string | Promise<string>
			>;
			expectTypeOf(mutation<undefined, number>).parameter(0).toExtend<
				(event: IpcMainEvent, input: number) => void | Promise<void>
			>;
			expectTypeOf(mutation<string, number>).parameter(0).toExtend<
				(event: IpcMainEvent, input: number) => string | Promise<string>
			>;
		});
	});

	describe("event handlers", () => {
		it("should type sendFromRenderer handler", () => {
			expect.assertions(2);

			expectTypeOf(sendFromRenderer<undefined>)
				.parameter(0)
				.toExtend<
					(event: IpcMainEvent, payload: undefined) => void | Promise<void>
				>();

			expectTypeOf(sendFromRenderer<{ type: "sendFromRenderer" }>).parameter(0)
				.toExtend<
				(
					event: IpcMainEvent,
					payload: { type: "sendFromRenderer" },
				) => void | Promise<void>
			>;
		});

		it("should type sendFromMain handler", () => {
			expect.assertions(2);

			expectTypeOf(sendFromMain<undefined>).parameter(0).toExtend<
				(input: {
					send: (options?: {
						frames?: number | [number, number] | undefined;
						targetWindows?: BrowserWindow[] | undefined;
					}) => void;
				}) => () => void
			>;

			expectTypeOf(sendFromMain<{ type: "sendFromMain" }>).parameter(0)
				.toExtend<
				(input: {
					send: (options?: {
						payload: { type: "sendFromMain" };
						frames?: number | [number, number] | undefined;
						targetWindows?: BrowserWindow[] | undefined;
					}) => void;
				}) => () => void
			>;
		});
	});
});
