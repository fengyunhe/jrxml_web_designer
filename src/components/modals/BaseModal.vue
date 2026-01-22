<template>
  <div 
    :key="keyForRecreation"
    v-if="!useVShow && visible" 
    class="modal-overlay" 
    @click.self="handleClose"
  >
    <div class="modal-content" :class="contentClass">
      <div class="modal-header" v-if="showHeader">
        <h3 class="modal-title">{{ title }}</h3>
        <n-button type="default" size="small" quaternary circle @click="handleClose" v-if="showCloseButton">×</n-button>
      </div>
      <div class="modal-body" :style="{ height: bodyHeight }">
        <slot></slot>
      </div>
      <div class="modal-footer" v-if="showFooter">
        <slot name="footer">
          <n-button type="default" @click="handleClose">{{ t('common.cancel') }}</n-button>
          <n-button type="primary" @click="handleConfirm">{{ t('common.confirm') }}</n-button>
        </slot>
      </div>
    </div>
  </div>
  <div 
    v-show="useVShow && visible" 
    class="modal-overlay" 
    @click.self="handleClose"
  >
    <div class="modal-content" :class="contentClass">
      <div class="modal-header" v-if="showHeader">
        <h3 class="modal-title">{{ title }}</h3>
        <n-button type="default" size="small" quaternary circle @click="handleClose" v-if="showCloseButton">×</n-button>
      </div>
      <div class="modal-body" :style="{ height: bodyHeight }">
        <slot></slot>
      </div>
      <div class="modal-footer" v-if="showFooter">
        <slot name="footer">
          <n-button type="default" @click="handleClose">{{ t('common.cancel') }}</n-button>
          <n-button type="primary" @click="handleConfirm">{{ t('common.confirm') }}</n-button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { NButton } from 'naive-ui';
import { ref, watch } from 'vue';

const { t } = useI18n();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  showFooter: {
    type: Boolean,
    default: true
  },
  showCloseButton: {
    type: Boolean,
    default: true
  },
  contentClass: {
    type: String,
    default: ''
  },
  bodyHeight: {
    type: String,
    default: ''
  },
  useVShow: {
    type: Boolean,
    default: false
  }
});

// Key for recreating the modal when using v-if
const keyForRecreation = ref(0);

// When useVShow changes, recreate the modal for v-if case
watch(
  () => props.useVShow,
  () => {
    keyForRecreation.value++;
  }
);

const emit = defineEmits(['update:visible', 'confirm', 'cancel']);

const handleClose = () => {
  emit('update:visible', false);
  emit('cancel');
};

const handleConfirm = () => {
  emit('update:visible', false);
  emit('confirm');
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  overflow: auto;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: max(50%, 700px);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-button:hover {
  background-color: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e8e8e8;
  background-color: #fafafa;
}


</style>
