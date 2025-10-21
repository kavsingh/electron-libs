import { defineConfig } from "tsdown";

export default defineConfig([
	{
		tsconfig: "./src/tsconfig.json",
		clean: true,
		dts: true,
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
		tsconfig: "./src/tsconfig.json",
		clean: false,
		dts: true,
		target: ["node22", "chrome130"],
		entry: ["./src/preload.ts"],
		format: ["cjs"],
	},
]);
