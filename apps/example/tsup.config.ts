import { defineConfig } from "tsup";

export default defineConfig([
	{
		clean: true,
		entry: ["./main.ts", "./renderer.ts"],
		target: ["node20", "chrome130"],
		splitting: true,
		format: ["esm"],
	},
	{
		entry: ["./preload.ts"],
		target: ["node20", "chrome130"],
		format: ["cjs"],
	},
]);
