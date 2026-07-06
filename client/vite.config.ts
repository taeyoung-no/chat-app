import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: path.resolve(__dirname, '..'),
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../nginx/ssl/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../nginx/ssl/cert.pem')),
    },
  },
})
