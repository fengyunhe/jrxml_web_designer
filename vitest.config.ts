import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // 忽略测试文件中的TypeScript错误
    typecheck: {
      enabled: false
    }
  },
  resolve: {
    alias: {
      '@': resolve(process.cwd(), './src'),
    },
  },
  // 确保测试文件使用ES模块
  esbuild: {
    target: 'esnext'
  }
})