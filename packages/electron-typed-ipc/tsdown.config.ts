import { defineConfig } from "tsdown";

export default defineConfig([
	// common should run in any platform
	{
		clean: true,
		dts: { build: true, generator: "oxc" },
		platform: "neutral",
		target: ["es2022"],
		entry: ["./src/common.ts"],
		format: ["esm"],
	},
	// preload scripts have access to DOM and a subset of Node.js and
	// Electron APIs
	{
		clean: false,
		dts: { build: true, generator: "oxc" },
		target: ["es2022"],
		entry: ["./src/preload.ts"],
		// cjs for preload scripts to ensure support for sandboxed environments:
		// https://www.electronjs.org/docs/latest/tutorial/esm#sandboxed-preload-scripts-cant-use-esm-imports
		format: ["cjs"],
		checks: { legacyCjs: false },
	},
	// main process Node.js only
	{
		clean: false,
		dts: { build: true, generator: "oxc" },
		platform: "node",
		target: ["node24"],
		entry: ["./src/main.ts"],
		format: ["esm"],
	},
	// renderer process browser only
	{
		clean: false,
		dts: { build: true, generator: "oxc" },
		platform: "browser",
		target: ["chrome130"],
		entry: ["./src/renderer.ts", "./src/test-renderer.ts"],
		format: ["esm"],
	},
]);
