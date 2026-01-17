import { defineConfig } from "tsdown";

export default defineConfig([
	{
		clean: true,
		entry: ["./electron/main.ts"],
		target: ["node24"],
		format: ["esm"],
	},
	{
		entry: ["./electron/preload.ts"],
		target: ["node24"],
		noExternal: [/@kavsingh/],
		format: ["cjs"],
		// tsdown warns on cjs builds which are required for sandboxed preload
		// scripts. this warning becomes an error on CI and blocks workflows
		failOnWarn: false,
	},
	{
		entry: ["./renderer/app.ts"],
		target: ["chrome130"],
		noExternal: [/@kavsingh/],
		format: ["esm"],
		copy: [{ from: "./renderer/app.{html,css}", to: "./dist" }],
	},
]);
