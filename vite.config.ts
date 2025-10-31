import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 配置base路径，适配GitHub Pages
  // 如果你的仓库名不是pdf_template_designer，请修改为你的实际仓库名
  base: '',
})
