import { defineConfig } from "tsdown";

export default defineConfig([
	{
		clean: true,
		entry: ["./main.ts"],
		target: ["node24"],
		format: ["esm"],
	},
	{
		entry: ["./renderer.ts"],
		target: ["chrome130"],
		noExternal: [/@kavsingh/],
		format: ["esm"],
		copy: [{ from: "./app.{html,css}", to: "./dist" }],
	},
	{
		entry: ["./preload.ts"],
		target: ["node24", "chrome130"],
		noExternal: [/@kavsingh/],
		format: ["cjs"],
	},
]);
