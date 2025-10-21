import {
	defineElectronTypedIpcSchema,
	mutation,
	query,
	sendFromMain,
	sendFromRenderer,
} from "../schema.ts";

export const typedIpcApi = defineElectronTypedIpcSchema({
	queryVoidArgVoidReturn: query<undefined, undefined>(),
	queryVoidArgStringReturn: query<string, undefined>(),
	queryNumberArgVoidReturn: query<undefined, number>(),
	queryStringArgNumberReturn: query<number, string>(),

	mutationVoidArgVoidReturn: mutation<undefined, undefined>(),
	mutationVoidArgStringReturn: mutation<string, undefined>(),
	mutationNumberArgVoidReturn: mutation<undefined, number>(),
	mutationStringArgNumberReturn: mutation<number, string>(),

	sendVoidFromMain: sendFromMain<undefined>(),
	sendPayloadFromMain: sendFromMain<SendFromMainPayload>(),

	sendVoidFromRenderer: sendFromRenderer<undefined>(),
	sendPayloadFromRenderer: sendFromRenderer<SendFromRendererPayload>(),
} as const);

export type TypedIpcApi = typeof typedIpcApi;

export interface SendFromMainPayload {
	type: "sendFromMain";
}

export interface SendFromRendererPayload {
	type: "sendFromRenderer";
}
