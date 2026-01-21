<template>
  <BaseModal
    :visible="visible"
    :showHeader="false"
    :showFooter="false"
    @update:visible="$emit('update:visible', $event)"
    @cancel="closeModal"
    :contentClass="'reward-modal-content'"
  >
    <div class="reward-content">
      <h3>您的支持是我持续更新的动力！</h3>
      <img src="/src/assets/FIREGOD_CN.jpg" alt="打赏码" class="reward-image">
      <p>使用微信扫码打赏，感谢支持！</p>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from './BaseModal.vue';

// 定义props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

// 定义emits
const emit = defineEmits(['update:visible']);

// 关闭弹窗
const closeModal = () => {
  emit('update:visible', false);
};
</script>

<style scoped>
/* Reward Modal Specific Styles */
.reward-modal-content {
  max-width: 400px;
  width: 90%;
}

:deep(.modal-body) {
  padding: 20px;
  text-align: center;
}

.reward-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.reward-image {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 0 auto 20px;
  display: block;
}

.reward-content p {
  color: #666;
  margin: 0;
}
</style>