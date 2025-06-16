import { defineConfig } from "tsdown";

export default defineConfig([
	{
		clean: true,
		entry: ["./main.ts", "./renderer.ts"],
		target: ["node20", "chrome130"],
		format: ["esm"],
		copy: [{ from: "./app.html", to: "./dist/app.html" }],
	},
	{
		entry: ["./preload.ts"],
		target: ["node20", "chrome130"],
		format: ["cjs"],
	},
]);
