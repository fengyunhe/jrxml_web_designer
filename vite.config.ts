import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'


// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 配置base路径，适配GitHub Pages
  // 如果你的仓库名不是pdf_template_designer，请修改为你的实际仓库名
  base: '',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // 排除测试文件
        return id.endsWith('.test.ts') || id.endsWith('.spec.ts');
      }
    }
  }
})
