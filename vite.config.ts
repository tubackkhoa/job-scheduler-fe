import { defineConfig, loadEnv } from 'vite';
import preact from '@preact/preset-vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const enableProxy = env.VITE_PROXY === 'true';

  return {
    plugins: [preact()],
    esbuild: {
      tsconfigRaw: 'tsconfig.build.json',
    },
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
