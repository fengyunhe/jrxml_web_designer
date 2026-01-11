<template>
  <div class="file-menu-container" ref="fileMenuContainer">
    <button @click="toggleFileMenu" class="file-menu-button">文件管理</button>
    <div v-if="showFileMenu" class="file-menu-dropdown">
      <div class="menu-item" @click="createNewFile">
        <span class="menu-icon">📄</span>
        <span>新建文件</span>
      </div>
      <div class="menu-item" @click="openLocalFile">
        <span class="menu-icon">📂</span>
        <span>打开本地文件</span>
      </div>
      <div class="menu-item" @click="saveCurrentFileToStorage" :disabled="!currentFileName || currentFileName === '未命名报表'">
        <span class="menu-icon">💾</span>
        <span>保存</span>
      </div>
      <div class="menu-item" @click="saveAsLocalFile">
        <span class="menu-icon">💾</span>
        <span>另存为</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item file-submenu-container" @click="toggleFileSubmenu">
        <span class="menu-icon">📋</span>
        <span>文件列表</span>
        <span class="submenu-arrow">▶</span>
        <div v-if="showFileSubmenu" class="file-submenu" @click.stop>
          <div class="submenu-header">
            <h4>文件列表</h4>
            <div class="file-filter">
              <input 
                v-model="fileFilterText" 
                type="text" 
                placeholder="搜索文件..." 
                class="filter-input"
                @click.stop
              />
              <button 
                v-if="fileFilterText" 
                @click.stop="fileFilterText = ''" 
                class="clear-filter-btn"
                title="清除搜索"
              >
                ✕
              </button>
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
                <button @click.stop="renameFileFromSubmenu(file)" class="btn-icon" title="重命名">
                  ✏️
                </button>
                <button @click.stop="deleteFileFromSubmenu(file)" class="btn-icon btn-danger" title="删除">
                  🗑️
                </button>
              </div>
            </div>
            <div v-if="filteredFiles.length === 0" class="empty-state">
              <p>没有找到文件</p>
              <button @click.stop="createNewFile" class="btn-primary">创建新文件</button>
            </div>
          </div>
          <div class="submenu-footer">
            <button @click.stop="createNewFile" class="btn-small btn-primary">新建文件</button>
            <button @click.stop="openLocalFile" class="btn-small btn-secondary">打开本地文件</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import notification from '../../../utils/notification';

interface DesignerFile {
  id: string;
  name: string;
  content?: string;
  lastModified?: Date | string;
  createdAt?: Date | string;
}

interface Props {
  currentFileName: string;
  currentFileId: string | null;
}

interface Emits {
  (e: 'create-new-file'): void;
  (e: 'load-file', file: DesignerFile): void;
  (e: 'update:currentFileName', name: string): void;
  (e: 'update:currentFileId', id: string | null): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 文件管理相关状态
const showFileMenu = ref(false);
const showFileSubmenu = ref(false);
const fileMenuContainer = ref<HTMLElement | null>(null);
const files = ref<DesignerFile[]>([]);
const fileFilterText = ref('');

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

// 从localStorage加载文件列表
function loadFilesFromStorage() {
  try {
    const storedFiles = localStorage.getItem('pdfDesignerFiles');
    if (storedFiles) {
      const parsedFiles = JSON.parse(storedFiles) as DesignerFile[];
      files.value = parsedFiles.map((file: DesignerFile) => ({
        ...file,
        lastModified: new Date(file.lastModified || Date.now()),
        createdAt: new Date(file.createdAt || Date.now())
      }));
    }
  } catch (error) {
    console.error('加载文件列表失败:', error);
  }
}

// 保存文件列表到localStorage
function saveFilesToStorage() {
  try {
    localStorage.setItem('pdfDesignerFiles', JSON.stringify(files.value));
  } catch (error) {
    console.error('保存文件列表失败:', error);
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
  const newName = prompt('请输入新的文件名:', file.name);
  if (newName && newName !== file.name) {
    const fileIndex = files.value.findIndex((f: DesignerFile) => f.id === file.id);
    if (fileIndex !== -1 && files.value[fileIndex]) {
      files.value[fileIndex].name = newName;
      files.value[fileIndex].lastModified = new Date();
      saveFilesToStorage();
      
      if (props.currentFileId === file.id) {
        emit('update:currentFileName', newName);
      }
    }
  }
}

// 从子菜单删除文件
function deleteFileFromSubmenu(file: DesignerFile) {
  if (confirm(`确定要删除文件 "${file.name}" 吗？此操作不可撤销。`)) {
    const fileIndex = files.value.findIndex((f: DesignerFile) => f.id === file.id);
    if (fileIndex !== -1) {
      files.value.splice(fileIndex, 1);
      saveFilesToStorage();
      
      if (props.currentFileId === file.id) {
        emit('update:currentFileName', '未命名报表');
        emit('update:currentFileId', null);
      }
    }
  }
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
          notification.error('文件格式不正确，无法加载');
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
  // 触发父组件的保存逻辑
  // 这里需要通过事件通知父组件执行保存操作
}

// 另存为本地文件
function saveAsLocalFile() {
  showFileMenu.value = false;
  // 触发父组件的另存为逻辑
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
  padding: 8px 16px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.file-menu-button:hover {
  background-color: #e0e0e0;
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

.btn-icon {
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.btn-icon.btn-danger:hover {
  background-color: rgba(255, 77, 79, 0.1);
}

.submenu-footer {
  padding: 12px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 8px;
  background-color: #f9f9f9;
}

.btn-small {
  padding: 4px 12px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #1890ff;
  color: white;
}

.btn-primary:hover {
  background-color: #40a9ff;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #999;
}

.empty-state .btn-primary {
  margin-top: 8px;
}
</style>
