import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
            },
            manifest: {
                short_name: 'Useful Tools',
                name: 'Useful Tools',
                icons: [
                    {
                        src: 'favicon.ico',
                        sizes: '64x64 32x32 24x24 16x16',
                        type: 'image/x-icon'
                    }
                ],
                start_url: '.',
                display: 'standalone',
                theme_color: '#ffffff',
                background_color: '#f8fafc'
            }
        })
    ],
    server: { port: 5173 },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
                        return 'vendor-react'
                    }
                    if (id.includes('node_modules/antd')) {
                        return 'vendor-antd'
                    }
                    if (id.includes('node_modules/lucide-react')) {
                        return 'vendor-lucide'
                    }
                }
            }
        }
    }
})
