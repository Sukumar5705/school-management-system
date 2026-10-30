import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load environment variables from parent (root) and client folders
  const env = {
    ...process.env,
    ...loadEnv(mode, path.resolve(__dirname, ".."), ""),
    ...loadEnv(mode, process.cwd(), ""),
  };

  const backendPort = env.PORT || "5000";
  const backendTarget = env.VITE_BACKEND_URL || `http://127.0.0.1:${backendPort}`;

  return {
    plugins: [react()],
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: false,
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
