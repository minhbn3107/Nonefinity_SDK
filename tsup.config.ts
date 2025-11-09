import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    simple: "src/simple.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  loader: {
    ".css": "copy",
  },
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    };
  },
});
