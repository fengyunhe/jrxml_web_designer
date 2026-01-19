import { createI18n } from 'vue-i18n'
import zh from './locales/zh.json'
import en from './locales/en.json'

const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: 'zh', // Default locale
  fallbackLocale: 'en',
  messages: {
    zh,
    en
  }
})

export default i18n
