import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const allowedHostsEnv = env.VITE_PREVIEW_ALLOWED_HOSTS;
  const allowedHosts = allowedHostsEnv
    ? allowedHostsEnv
        .split(",")
        .map((host) => host.trim())
        .filter(Boolean)
    : [""];

  return {
    plugins: [react()],
    preview: {
      allowedHosts,
    },
  };
});
