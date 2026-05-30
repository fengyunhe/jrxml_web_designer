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
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/vue') || id.includes('node_modules/vue-i18n')) return 'vue-vendor';
          if (id.includes('node_modules/@codemirror')) return 'codemirror';
          if (id.includes('node_modules/naive-ui')) return 'naive-ui';
        },
      },
      external: (id) => {
        // 排除测试文件
        return id.endsWith('.test.ts') || id.endsWith('.spec.ts');
      },
    },
  },
})
