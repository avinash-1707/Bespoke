import { defineConfig } from "tsup";

// Bundle workspace packages (they ship raw TS) into the output so the
// production build is a self-contained JS bundle Node can run directly.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  clean: true,
  sourcemap: true,
  noExternal: ["@bespoke/shared", "@bespoke/db", "@bespoke/queue"],
});
