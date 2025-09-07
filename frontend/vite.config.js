import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist", // ensures Vercel finds the built files
  },
  server: {
    port: 3000, // local dev only, safe to keep
  },
});
