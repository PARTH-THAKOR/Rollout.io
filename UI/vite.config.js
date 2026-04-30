import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        // ─── Code splitting ──────────────────────────────────
        // Vendor libs are split into their own long-lived cache chunk.
        rollupOptions: {
            output: {
                manualChunks: {
                    // Heavy vendor dependencies in their own cacheable chunk
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-query': ['@tanstack/react-query'],
                    'vendor-firebase': ['firebase/app', 'firebase/auth'],
                    'vendor-reactflow': ['@xyflow/react'],
                },
            },
        },
        // ─── Minification ────────────────────────────────────
        // esbuild is the default and fastest minifier in Vite
        minify: 'esbuild',
        // Increase chunk size warning to reduce noise
        chunkSizeWarningLimit: 600,
        // Enable source maps for debugging (disabled in real prod deploy)
        sourcemap: false,
        // CSS code splitting — each lazy route gets its own CSS chunk
        cssCodeSplit: true,
    },
    // ─── Dev Server ──────────────────────────────────────────
    server: {
        // Pre-transform known heavy deps on startup
        warmup: {
            clientFiles: [
                './src/pages/Login.jsx',
                './src/pages/Dashboard.jsx',
            ],
        },
    },
    // ─── Dependency pre-bundling ─────────────────────────────
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            '@tanstack/react-query',
            'zustand',
            'js-cookie',
            'remixicon/fonts/remixicon.css',
        ],
    },
})
