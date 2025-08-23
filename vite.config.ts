import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    historyApiFallback: true,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React libs - keep small and prioritized
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-core';
          }
          
          // Router - separate chunk for navigation
          if (id.includes('react-router-dom')) {
            return 'router';
          }
          
          // Query client - defer loading
          if (id.includes('@tanstack/react-query')) {
            return 'query';
          }
          
          // UI libraries - split into smaller chunks
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          
          // Radix components - split by usage pattern
          if (id.includes('@radix-ui/react-dialog') || id.includes('@radix-ui/react-dropdown-menu')) {
            return 'radix-overlay';
          }
          if (id.includes('@radix-ui/react-select') || id.includes('@radix-ui/react-toast')) {
            return 'radix-forms';
          }
          if (id.includes('@radix-ui/')) {
            return 'radix-other';
          }
          
          // Supabase - defer loading
          if (id.includes('@supabase/supabase-js')) {
            return 'supabase';
          }
          
          // Charts - defer loading (heavy)
          if (id.includes('recharts')) {
            return 'charts';
          }
          
          // Utilities - keep small
          if (id.includes('clsx') || id.includes('class-variance-authority') || id.includes('tailwind-merge')) {
            return 'utils';
          }
          
          // Internationalization
          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'i18n';
          }
          
          // Form libraries
          if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('zod')) {
            return 'forms';
          }
          
          // Large vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return `assets/[name]-[hash][extname]`;
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
      },
    },
  },
}));
