import { defineConfig } from "tsdown";

export default defineConfig([
	{
		clean: true,
		entry: ["./main.ts"],
		target: ["node22"],
		format: ["esm"],
	},
	{
		entry: ["./renderer.ts"],
		target: ["chrome134"],
		noExternal: [/@kavsingh/],
		format: ["esm"],
		copy: [{ from: "./app.html", to: "./dist/app.html" }],
	},
	{
		entry: ["./preload.ts"],
		target: ["node22", "chrome134"],
		noExternal: [/@kavsingh/],
		format: ["cjs"],
	},
]);
