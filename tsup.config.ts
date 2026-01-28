import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "claude/index": "src/claude/index.ts",
    "opencode/index": "src/opencode/index.ts",
    "bin/claude-hook": "src/bin/claude-hook.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "node18",
  shims: false,
  banner: {
    js: "#!/usr/bin/env node",
  },
})
