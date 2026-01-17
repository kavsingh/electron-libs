import { defineConfig } from "tsdown";

export default defineConfig([
	{
		clean: true,
		dts: { build: true },
		target: ["node22", "chrome130"],
		entry: [
			"./src/common.ts",
			"./src/main.ts",
			"./src/renderer.ts",
			"./src/test-renderer.ts",
		],
		format: ["cjs", "esm"],
	},
	{
		clean: false,
		dts: { build: true },
		target: ["node22", "chrome130"],
		entry: ["./src/preload.ts"],
		format: ["cjs"],
	},
]);
