import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const enableProxy = env.VITE_PROXY === 'true';

  return {
    build: {
      target: 'esnext',
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) return 'vendor';
          },
        },
      },
    },
    plugins: [react({ babel: { plugins: ['babel-plugin-react-compiler'] } })],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },

    server: {
      ...(enableProxy && {
        proxy: {
          '^/(api|auth|health)': {
            target: env.VITE_API_BASE_URL,
            changeOrigin: true,
          },
        },
      }),
    },
  };
});
