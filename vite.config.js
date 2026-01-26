import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const allowedHostsEnv = env.VITE_PREVIEW_ALLOWED_HOSTS;
  const allowedHosts = allowedHostsEnv
    ? allowedHostsEnv
        .split(',')
        .map((host) => host.trim())
        .filter(Boolean)
    : [''];

  const enableProxy = env.VITE_PROXY === 'true';

  return {
    plugins: [react({ babel: { plugins: ['babel-plugin-react-compiler'] } })],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    preview: {
      allowedHosts
    },
    server: {
      ...(enableProxy && {
        proxy: {
          '^/(api|auth|health)': {
            target: env.VITE_API_BASE_URL,
            changeOrigin: true
          }
        }
      })
    }
  };
});
