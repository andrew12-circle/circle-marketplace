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
          if (id.includes('react/') && !id.includes('node_modules')) {
            return 'react-core';
          }
          if (id.includes('react-dom')) {
            return 'react-core';
          }
          
          // Router - separate chunk for navigation
          if (id.includes('react-router-dom')) {
            return 'router';
          }
          
          // Query client - defer loading for data operations
          if (id.includes('@tanstack/react-query')) {
            return 'query';
          }
          
          // Charts - highly unused on homepage, defer completely
          if (id.includes('recharts') || id.includes('chart')) {
            return 'charts-lazy';
          }
          
          // Supabase - defer database operations
          if (id.includes('@supabase/supabase-js')) {
            return 'supabase-lazy';
          }
          
          // Split Radix UI by actual usage patterns
          if (id.includes('@radix-ui/react-dialog') || id.includes('@radix-ui/react-modal')) {
            return 'radix-modals';
          }
          if (id.includes('@radix-ui/react-dropdown') || id.includes('@radix-ui/react-popover')) {
            return 'radix-overlays';
          }
          if (id.includes('@radix-ui/react-select') || id.includes('@radix-ui/react-combobox')) {
            return 'radix-forms';
          }
          if (id.includes('@radix-ui/react-toast') || id.includes('@radix-ui/react-alert')) {
            return 'radix-feedback';
          }
          if (id.includes('@radix-ui/')) {
            return 'radix-other';
          }
          
          // Icons - split by usage
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          
          // Form libraries - defer until forms are actually used
          if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('zod')) {
            return 'forms-lazy';
          }
          
          // Internationalization - defer
          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'i18n-lazy';
          }
          
          // Authentication - defer until login
          if (id.includes('auth') && id.includes('node_modules')) {
            return 'auth-lazy';
          }
          
          // Payment processing - defer until checkout
          if (id.includes('stripe') || id.includes('payment')) {
            return 'payment-lazy';
          }
          
          // Utils - keep small
          if (id.includes('clsx') || id.includes('class-variance-authority') || id.includes('tailwind-merge')) {
            return 'utils';
          }
          
          // Date libraries - defer
          if (id.includes('date-fns') || id.includes('react-day-picker')) {
            return 'date-lazy';
          }
          
          // Large vendor libraries - defer
          if (id.includes('node_modules')) {
            return 'vendor-lazy';
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
