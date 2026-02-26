import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3001,
  },
  plugins: [react()],
  build: {
    sourcemap: true,
  },
  define: {
    global: "globalThis",
  },
});
