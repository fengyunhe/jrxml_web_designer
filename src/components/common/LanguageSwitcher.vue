<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const { locale } = useI18n()

const currentLanguage = computed({
  get: () => locale.value,
  set: (value) => {
    locale.value = value
  }
})

const languages = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'English' }
]
</script>

<template>
  <div class="language-switcher">
    <select v-model="currentLanguage">
      <option v-for="lang in languages" :key="lang.code" :value="lang.code">
        {{ lang.name }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.language-switcher select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.language-switcher select:hover {
  border-color: #aaa;
}
</style>
