import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "./src/index.ts",
    core: "./src/core.ts",
  },
  dts: true,
  format: ["esm", "cjs"],
  external: ["node:fs", "node:path"],
  platform: "neutral",
  sourcemap: true,
  minify: true,
  exports: true,
});
