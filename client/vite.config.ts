import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  return {
    plugins: [react(), tailwindcss()],
    envDir: path.resolve(__dirname, '..'),
    server:
      command === 'serve' // npm run dev인 경우
        ? {
            https: {
              key: fs.readFileSync(path.resolve(__dirname, '../nginx/ssl/key.pem')),
              cert: fs.readFileSync(path.resolve(__dirname, '../nginx/ssl/cert.pem')),
            },
          }
        : undefined,
  }
})
