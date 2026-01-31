import { defineConfig } from "tsup"

export default defineConfig({
  entry: { "louder-opencode": "src/opencode/index.ts" },
  format: ["esm"],
  target: "node18",
  outDir: "dist-plugin",
  noExternal: [/.*/],
  bundle: true,
  splitting: false,
  clean: true,
})
