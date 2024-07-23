/* eslint-disable import/no-extraneous-dependencies */
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8080,
  },
  plugins: [vue()],
  resolve: {
    alias: {
      "bn.js": resolve(__dirname, "node_modules/bn.js"),
    },
  },
  define: {
    global: "globalThis",
  },
});
