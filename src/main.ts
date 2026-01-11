import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { initializeAllPlugins } from './plugins/PluginRegistry'

// 初始化插件系统
initializeAllPlugins()

createApp(App).mount('#app')
