import { defineConfig } from "tsdown";

export default defineConfig({
	clean: true,
	dts: true,
	entry: [
		"./src/common.ts",
		"./src/main.ts",
		"./src/preload.ts",
		"./src/renderer.ts",
		"./src/test-renderer.ts",
	],
	format: ["cjs", "esm"],
});
