import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            '/api': 'http://localhost:5000'
        }
    },
    build: {
        // Optimize chunk splitting for better caching
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom'],
                    'ui-vendor': ['framer-motion', 'lucide-react', 'recharts'],
                    'utils-vendor': ['axios', 'date-fns', 'zustand']
                }
            }
        },
        // Warn on large chunks
        chunkSizeWarningLimit: 1000,
        // Enable source maps for production debugging (optional)
        sourcemap: false,
        // Minify with terser for better compression
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true, // Remove console.log in production
                drop_debugger: true
            }
        }
    }
})
