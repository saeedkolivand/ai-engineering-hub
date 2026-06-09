import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "node:path";

// Shared packages export TS source; alias the names straight to source so Vite
// transpiles them with the app (avoids node_modules .ts resolution quirks).
const pkgSrc = (name: string, file = "index.ts") =>
  path.resolve(__dirname, "../../../../packages", name, "src", file);

export default defineConfig({
  plugins: [
    tailwindcss(),
    // Router plugin MUST come before react().
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "shared-design-tokens/tokens.css": pkgSrc("shared-design-tokens", "tokens.css"),
      "shared-design-tokens": pkgSrc("shared-design-tokens"),
      "shared-api-contracts": pkgSrc("shared-api-contracts"),
      "shared-events": pkgSrc("shared-events"),
      "shared-types": pkgSrc("shared-types"),
      "shared-sdk": pkgSrc("shared-sdk"),
    },
  },
  server: { port: 5173, strictPort: true },
  clearScreen: false,
});
