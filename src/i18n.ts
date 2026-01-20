import { createI18n } from 'vue-i18n'
import zh from './locales/zh.json'
import en from './locales/en.json'

// 从sessionStorage读取语言设置，如果没有则使用浏览器语言
let savedLocale = sessionStorage.getItem('appLocale');

// 如果sessionStorage中没有语言设置，则检测浏览器语言
if (!savedLocale) {
  const browserLocale = navigator.language || navigator.languages?.[0] || 'zh';
  // 浏览器语言是中文（包括zh-CN、zh-TW等）则使用中文，否则使用英语
  savedLocale = browserLocale.startsWith('zh') ? 'zh' : 'en';
}

const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: savedLocale, // 使用保存的语言或默认语言
  fallbackLocale: 'en',
  interpolation: {
    escapeValue: true // 默认 true，确保大括号转义生效
  },
  messages: {
    zh,
    en
  }
})

export default i18n
