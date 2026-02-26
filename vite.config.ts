import { defineConfig, loadEnv } from 'vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const enableProxy = env.VITE_PROXY === 'true';

  return {
    build: {
      target: 'esnext',
      chunkSizeWarningLimit: 5000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) return 'vendor';
          },
        },
      },
    },
    resolve: {
      alias: {
        react: 'preact/compat',
        'react-dom': 'preact/compat',
        'react/jsx-runtime': 'preact/jsx-runtime',
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
