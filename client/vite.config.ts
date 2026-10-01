/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    // The proxy is the only API config — no VITE_API_URL, so calls are same-origin
    // in dev and in production alike.
    server: {
        proxy: {
            '/api': 'http://localhost:3000',
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/setupTests.ts',
    },
});
