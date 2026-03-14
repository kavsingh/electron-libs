import { defineConfig } from "tsdown";

export default defineConfig([
	// common should run in any platform
	{
		clean: true,
		dts: { build: true },
		platform: "neutral",
		target: ["es2022"],
		entry: ["./src/common.ts"],
		format: ["esm"],
	},
	// preload scripts have access to DOM and a subset of Node.js and
	// Electron APIs
	{
		clean: false,
		dts: { build: true },
		target: ["es2022"],
		entry: ["./src/preload.ts"],
		format: ["cjs"],
	},
	// main process Node.js only
	{
		clean: false,
		dts: { build: true },
		platform: "node",
		target: ["node22"],
		entry: ["./src/main.ts"],
		format: ["esm"],
	},
	// renderer process browser only
	{
		clean: false,
		dts: { build: true },
		platform: "browser",
		target: ["chrome130"],
		entry: ["./src/renderer.ts", "./src/test-renderer.ts"],
		format: ["esm"],
	},
]);
