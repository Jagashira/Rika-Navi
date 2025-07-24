// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";
import { resolve } from "path";

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        // offscreen: resolve(__dirname, "offscreen.html"),
        fetcher: resolve(__dirname, "fetcher.html"),
        // auth: resolve(__dirname, "auth.html"),
      },
    },
  },
});
