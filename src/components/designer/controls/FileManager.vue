<template>
  <div class="file-menu-container" ref="fileMenuContainer">
    <n-button @click="toggleFileMenu" type="default">{{ t('fileManager.title') }}</n-button>
    <div v-if="showFileMenu" class="file-menu-dropdown">
      <div class="menu-item" @click="createNewFile">
        <span class="menu-icon">📄</span>
        <span>{{ t('fileManager.newFile') }}</span>
      </div>
      <div class="menu-item" @click="openLocalFile">
        <span class="menu-icon">📂</span>
        <span>{{ t('fileManager.openLocalFile') }}</span>
      </div>
      <div class="menu-item" @click="saveCurrentFileToStorage" :disabled="!currentFileName || currentFileName === t('fileManager.untitledReport')">
        <span class="menu-icon">💾</span>
        <span>{{ t('fileManager.save') }}</span>
      </div>
      <div class="menu-item" @click="saveAsLocalFile">
        <span class="menu-icon">💾</span>
        <span>{{ t('fileManager.saveAs') }}</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item file-submenu-container" @click="toggleFileSubmenu">
        <span class="menu-icon">📋</span>
        <span>{{ t('fileManager.fileList') }}</span>
        <span class="submenu-arrow">▶</span>
        <div v-if="showFileSubmenu" class="file-submenu" @click.stop>
          <div class="submenu-header">
            <h4>{{ t('fileManager.fileList') }}</h4>
            <div class="file-filter">
              <input 
                v-model="fileFilterText" 
                type="text" 
                :placeholder="t('fileManager.searchFile')" 
                class="filter-input"
                @click.stop
              />
              <n-button 
                v-if="fileFilterText" 
                @click.stop="fileFilterText = ''" 
                type="default"
                quaternary
                circle
                size="small"
                :title="t('fileManager.searchFile')"
              >
                ✕
              </n-button>
            </div>
          </div>
          <div class="submenu-file-list">
            <div 
              v-for="file in filteredFiles" 
              :key="file.id"
              class="submenu-file-item"
              :class="{ 'active': currentFileName === file.name }"
              @click.stop="selectFileFromSubmenu(file)"
            >
              <div class="file-info">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-date">{{ formatDate(file.lastModified) }}</span>
              </div>
              <div class="file-item-actions">
                <n-button @click.stop="renameFileFromSubmenu(file)" type="default" quaternary circle size="small" :title="t('fileManager.rename')">
                  ✏️
                </n-button>
                <n-button @click.stop="deleteFileFromSubmenu(file)" type="error" quaternary circle size="small" :title="t('fileManager.delete')">
                  🗑️
                </n-button>
              </div>
            </div>
            <div v-if="filteredFiles.length === 0" class="empty-state">
              <p>{{ t('fileManager.noFilesFound') }}</p>
              <n-button @click.stop="createNewFile" type="primary">{{ t('fileManager.createNewFile') }}</n-button>
            </div>
          </div>
          <div class="submenu-footer">
            <n-button @click.stop="createNewFile" type="primary" size="small">{{ t('fileManager.newFile') }}</n-button>
            <n-button @click.stop="openLocalFile" type="default" size="small">{{ t('fileManager.openLocalFile') }}</n-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 重命名弹窗 -->
    <InputModal
      v-model:visible="showRenameModal"
      :title="t('fileManager.renameFile')"
      :message="t('fileManager.enterNewFileName')"
      :default-value="pendingFile?.name || ''"
      @confirm="handleConfirmRename"
    />

    <!-- 删除确认弹窗 -->
    <ConfirmModal
      v-model:visible="showDeleteModal"
      :title="t('fileManager.deleteFile')"
      :message="t('fileManager.deleteFileConfirm', { name: pendingFile?.name })"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { NButton } from 'naive-ui';
import notification from '../../../utils/notification';
import { useDesignerFiles } from '@/composables/useDesignerFiles';
import type { DesignerFile } from '@/types/designerFile';
import ConfirmModal from '../../modals/ConfirmModal.vue';
import InputModal from '../../modals/InputModal.vue';

const { t } = useI18n();

interface Props {
  currentFileName: string;
  currentFileId: string | null;
}

interface Emits {
  (e: 'create-new-file'): void;
  (e: 'load-file', file: DesignerFile): void;
  (e: 'save-current-file'): void;
  (e: 'save-as-file'): void;
  (e: 'update:currentFileName', name: string): void;
  (e: 'update:currentFileId', id: string | null): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const currentFileNameRef = computed({
  get: () => props.currentFileName,
  set: (value: string) => emit('update:currentFileName', value)
});

const currentFileIdRef = computed({
  get: () => props.currentFileId,
  set: (value: string | null) => emit('update:currentFileId', value)
});

// 文件管理相关状态
const showFileMenu = ref(false);
const showFileSubmenu = ref(false);
const fileMenuContainer = ref<HTMLElement | null>(null);
const fileFilterText = ref('');
const showRenameModal = ref(false);
const showDeleteModal = ref(false);
const pendingFile = ref<DesignerFile | null>(null);

const {
  files,
  loadFilesFromStorage,
  renameFile,
  deleteFile
} = useDesignerFiles({
  currentFileName: currentFileNameRef,
  currentFileId: currentFileIdRef
});

// 计算属性：过滤后的文件列表
const filteredFiles = computed(() => {
  if (!fileFilterText.value) {
    return files.value;
  }
  return files.value.filter((file: DesignerFile) => 
    file.name.toLowerCase().includes(fileFilterText.value.toLowerCase())
  );
});

// 格式化日期
function formatDate(date: Date | string | undefined) {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// 切换文件菜单
function toggleFileMenu() {
  showFileMenu.value = !showFileMenu.value;
  showFileSubmenu.value = false;
}

// 切换文件列表子菜单
function toggleFileSubmenu() {
  showFileSubmenu.value = !showFileSubmenu.value;
  if (showFileSubmenu.value) {
    loadFilesFromStorage();
  }
}

// 从子菜单选择文件
function selectFileFromSubmenu(file: DesignerFile) {
  showFileSubmenu.value = false;
  showFileMenu.value = false;
  emit('load-file', file);
}

// 从子菜单重命名文件
function renameFileFromSubmenu(file: DesignerFile) {
  pendingFile.value = file;
  showRenameModal.value = true;
}

// 确认重命名
function handleConfirmRename(newName: string) {
  if (pendingFile.value && newName && newName !== pendingFile.value.name) {
    renameFile(pendingFile.value.id, newName);
  }
  pendingFile.value = null;
}

// 从子菜单删除文件
function deleteFileFromSubmenu(file: DesignerFile) {
  pendingFile.value = file;
  showDeleteModal.value = true;
}

// 确认删除
function handleConfirmDelete() {
  if (pendingFile.value) {
    deleteFile(pendingFile.value.id);
  }
  pendingFile.value = null;
}

// 创建新文件
function createNewFile() {
  showFileMenu.value = false;
  emit('create-new-file');
}

// 打开本地文件
function openLocalFile() {
  showFileMenu.value = false;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          JSON.parse(content); // 验证JSON格式
          loadFile({
            id: null,
            name: file.name,
            content: content
          });
        } catch (error) {
          console.error('加载文件失败:', error);
          notification.error(t('fileManager.invalidFileFormat'));
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

// 保存当前文件到存储
function saveCurrentFileToStorage() {
  showFileMenu.value = false;
  emit('save-current-file');
}

// 另存为本地文件
function saveAsLocalFile() {
  showFileMenu.value = false;
  emit('save-as-file');
}

// 加载文件
function loadFile(fileData: any) {
  emit('load-file', fileData);
}

// 点击外部关闭菜单
function handleClickOutside(event: MouseEvent) {
  if (fileMenuContainer.value && !fileMenuContainer.value.contains(event.target as Node)) {
    showFileMenu.value = false;
    showFileSubmenu.value = false;
  }
}

// 监听点击事件
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  loadFilesFromStorage();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.file-menu-container {
  position: relative;
  display: inline-block;
}

.file-menu-button {
  padding: 0.3rem 0.8rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.file-menu-button:hover {
  background-color: #5a6268;
}

.file-menu-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 200px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  position: relative;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

.menu-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-icon {
  margin-right: 8px;
  font-size: 16px;
}

.menu-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 4px 0;
}

.submenu-arrow {
  margin-left: auto;
  font-size: 12px;
  transition: transform 0.2s ease;
}

.file-submenu-container:hover .submenu-arrow {
  transform: rotate(90deg);
}

.file-submenu {
  position: absolute;
  top: 0;
  left: 100%;
  margin-left: 4px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  min-width: 300px;
  max-height: 400px;
}

.submenu-header {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f9f9f9;
}

.submenu-header h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.file-filter {
  position: relative;
}

.filter-input {
  width: 100%;
  padding: 6px 30px 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  box-sizing: border-box;
}

.clear-filter-btn {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #999;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-filter-btn:hover {
  color: #333;
}

.submenu-file-list {
  max-height: 250px;
  overflow-y: auto;
  padding: 8px;
}

.submenu-file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  margin-bottom: 4px;
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 12px;
}

.submenu-file-item.active {
  background-color: #e6f7ff;
  border-color: #1890ff;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  display: block;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.file-date {
  display: block;
  font-size: 10px;
  color: #999;
}

.file-item-actions {
  display: flex;
  gap: 4px;
}

.submenu-footer {
  padding: 12px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 8px;
  background-color: #f9f9f9;
}

.empty-state :deep(.n-button) {
  margin-top: 8px;
}
</style>
