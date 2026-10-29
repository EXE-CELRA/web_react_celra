import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor-chartjs';
            }
            if (id.includes('@ant-design/icons')) {
              return 'vendor-antd-icons';
            }
            if (id.includes('antd') || id.includes('@rc-component') || id.includes('rc-')) {
              return 'vendor-antd';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (id.includes('react-router-dom') || id.includes('zustand') || id.includes('axios')) {
              return 'vendor-core';
            }
          }
        },
      },
    },
  },
})
