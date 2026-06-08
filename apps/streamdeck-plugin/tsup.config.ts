import { defineConfig } from "tsup";

// Bundle the plugin (incl. the Elgato SDK + shared-sdk) into a single, self-contained
// file that the Stream Deck app launches. CodePath in the manifest -> bin/plugin.js.
export default defineConfig({
  entry: { plugin: "src/plugin.ts" },
  outDir: "com.aiengineering.monitor.sdPlugin/bin",
  format: ["esm"],
  platform: "node",
  target: "node20",
  bundle: true,
  noExternal: [/.*/],
  clean: true,
  sourcemap: false,
});
