
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  // Configure proper MIME types for audio files
  assetsInclude: ['**/*.mp3', '**/*.wav', '**/*.ogg'],
  build: {
    rollupOptions: {
      output: {
        // Ensure audio files are properly handled
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && /\.(mp3|wav|ogg)$/i.test(assetInfo.name)) {
            return 'sounds/[name].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: [
            '@radix-ui/react-toast',
            '@radix-ui/react-progress',
            '@radix-ui/react-slot',
            '@radix-ui/react-dialog',
            'class-variance-authority',
            'clsx',
            'tailwind-merge'
          ]
        }
      }
    }
  }
}));
