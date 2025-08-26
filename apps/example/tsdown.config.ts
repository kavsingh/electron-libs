import { defineConfig } from "tsdown";

export default defineConfig([
	{
		clean: true,
		entry: ["./main.ts"],
		target: ["node20"],
		format: ["esm"],
	},
	{
		entry: ["./renderer.ts"],
		target: ["chrome130"],
		format: ["esm"],
		copy: [
			{ from: "./app.html", to: "./dist/app.html" },
			{ from: "./app.css", to: "./dist/app.css" },
		],
	},
	{
		entry: ["./preload.ts"],
		target: ["node20", "chrome130"],
		format: ["cjs"],
	},
]);
