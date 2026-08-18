import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import path from "node:path";

const env = loadEnv("test", process.cwd(), "");
Object.assign(process.env, env);

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
