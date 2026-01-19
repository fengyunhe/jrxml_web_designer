<template>
  <div v-if="visible" class="reward-modal" @click.self="closeModal">
    <div class="reward-content">
      <button class="close-btn" @click="closeModal">×</button>
      <h3>您的支持是我持续更新的动力！</h3>
      <img src="/src/assets/FIREGOD_CN.jpg" alt="打赏码" class="reward-image">
      <p>使用微信扫码打赏，感谢支持！</p>
    </div>
  </div>
</template>

<script setup lang="ts">
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
.reward-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.reward-content {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #f0f0f0;
}

.reward-image {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 20px 0;
}

.reward-content h3 {
  margin-top: 10px;
  color: #333;
}

.reward-content p {
  color: #666;
  margin-top: 10px;
}
</style>