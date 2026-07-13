import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Forced restart for Vite dependency pre-bundling
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file variables
  const env = loadEnv(mode, process.cwd(), '');
  
  // Extract target origin from VITE_API_URL
  let targetUrl = '';
  if (env.VITE_API_URL) {
    try {
      const url = new URL(env.VITE_API_URL);
      targetUrl = `${url.protocol}//${url.host}`;
    } catch (e) {
      console.warn('WARNING: Invalid VITE_API_URL found in .env');
    }
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      port: 5173,
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['X-Requested-With', 'content-type', 'Authorization'],
      },
      proxy: targetUrl ? {
        '/api': {
          target: targetUrl,
          changeOrigin: true,
        },
      } : {},
    },
  };
});

