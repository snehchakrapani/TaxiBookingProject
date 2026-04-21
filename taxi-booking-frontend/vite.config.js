import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/nominatim-api": {
        target: "https://nominatim.openstreetmap.org",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/nominatim-api/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.removeHeader("origin");
            proxyReq.removeHeader("referer");
            proxyReq.setHeader("accept-language", "en-IN,en;q=0.9");
          });
        },
      },
      "/osrm-api": {
        target: "https://router.project-osrm.org",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/osrm-api/, "/route/v1/driving"),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.removeHeader("origin");
            proxyReq.removeHeader("referer");
          });
        },
      },
      "/photon-api": {
        target: "https://photon.komoot.io",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/photon-api/, "/api"),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.removeHeader("origin");
            proxyReq.removeHeader("referer");
            proxyReq.setHeader("accept-language", "en-IN,en;q=0.9");
          });
        },
      },
    },
  },
});
