import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [
      "localhost",
      "8080-iwni9n0g7vkragio5687l-6532622b.e2b.dev",
      "8081-iwni9n0g7vkragio5687l-6532622b.e2b.dev",
      /.*-iwni9n0g7vkragio5687l-6532622b\.e2b\.dev$/ // Allow any port on this sandbox
    ],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['react-pdf'],
  },
  build: {
    modulePreload: {
      polyfill: false, // Modern browsers only
    },
    rollupOptions: {
      output: {
        // Ensure proper cache busting with content hashes
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-tabs', '@radix-ui/react-select'],
          'pdf-vendor': ['react-pdf', 'pdfjs-dist'],
        },
      },
    },
    commonjsOptions: {
      include: [/react-pdf/, /node_modules/],
    },
  },
}));
