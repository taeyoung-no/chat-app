import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.NODE_ENV = 'test'
process.env.SESSION_SECRET = 'test-session-secret-1234567890-very-long-string'
process.env.CLIENT_URL = 'https://localhost:5173'
process.env.REDIS_URL = 'redis://127.0.0.1:6379'

export default defineConfig({
  resolve: {
    alias: {
      shared: path.resolve(__dirname, '../shared'),
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.test.ts'],
  },
})
