/* eslint-disable import/no-extraneous-dependencies */
import tailwind from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8080,
  },
  plugins: [tailwind(), vue()],
  build: {
    sourcemap: true,
  },
  define: {
    global: "globalThis",
  },
});
