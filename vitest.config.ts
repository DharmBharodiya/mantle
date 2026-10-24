import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  esbuild: { jsx: "automatic" },
  test: { environment: "node", exclude: ["node_modules/**", ".next/**", ".next-ingestion-check/**", "mantle-kit/**"] },
});
