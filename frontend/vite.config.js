import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@store': path.resolve(__dirname, './src/store'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@assets': path.resolve(__dirname, './src/assets')
    },
  },
  define: {
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      REACT_APP_API_URL: JSON.stringify(process.env.VITE_API_URL),
    }
  },
  publicDir: 'public',
  css: {
    preprocessorOptions: {
      scss: {
        // Enable modern API for Sass
        sassOptions: {
          outputStyle: 'compressed',
          charset: false,
        },
      }
    },
    devSourcemap: true,
  }
}); 