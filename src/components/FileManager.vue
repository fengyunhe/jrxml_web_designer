<template>
  <div class="file-manager-content">
    <div class="file-manager-header">
      <div class="file-actions">
        <button @click="createNewFile" class="btn-primary btn-small">新建文件</button>
        <button @click="openLocalFile" class="btn-secondary btn-small">打开本地文件</button>
        <button @click="() => saveCurrentFile()" class="btn-secondary btn-small" :disabled="!currentFile">保存</button>
        <button @click="() => saveAsLocalFile()" class="btn-secondary btn-small" :disabled="!currentFile">另存为</button>
      </div>
    </div>
    
    <div class="file-list-container">
      <div class="file-list-header">
        <h4>文件列表</h4>
        <div class="file-filter">
          <input 
            v-model="fileFilterText" 
            type="text" 
            placeholder="搜索文件..." 
            class="filter-input"
          />
          <button 
            v-if="fileFilterText" 
            @click="fileFilterText = ''" 
            class="clear-filter-btn"
            title="清除搜索"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div class="file-list">
        <div 
          v-for="file in filteredFiles" 
          :key="file.id"
          class="file-item"
          :class="{ 'active': currentFile && currentFile.id === file.id }"
          @click="selectFile(file)"
        >
          <div class="file-info">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-date">{{ formatDate(file.lastModified) }}</span>
          </div>
          <div class="file-item-actions">
            <button @click.stop="renameFile(file)" class="btn-icon" title="重命名">
              ✏️
            </button>
            <button @click.stop="deleteFile(file)" class="btn-icon btn-danger" title="删除">
              🗑️
            </button>
          </div>
        </div>
        
        <div v-if="filteredFiles.length === 0" class="empty-state">
          <p>没有找到文件</p>
          <button @click="createNewFile" class="btn-primary">创建新文件</button>
        </div>
      </div>
    </div>
    
    <!-- 重命名对话框 -->
    <div v-if="showRenameDialog" class="modal-overlay" @click.self="cancelRename">
      <div class="modal">
        <h3>重命名文件</h3>
        <div class="form-group">
          <label>文件名</label>
          <input v-model="newFileName" type="text" ref="renameInput" />
        </div>
        <div class="modal-actions">
          <button @click="confirmRename" class="btn-primary">确定</button>
          <button @click="cancelRename" class="btn-secondary">取消</button>
        </div>
      </div>
    </div>
    
    <!-- 删除确认对话框 -->
    <div v-if="showDeleteDialog" class="modal-overlay" @click.self="cancelDelete">
      <div class="modal">
        <h3>确认删除</h3>
        <p>确定要删除文件 "{{ fileToDelete?.name }}" 吗？此操作不可撤销。</p>
        <div class="modal-actions">
          <button @click="confirmDelete" class="btn-danger">删除</button>
          <button @click="cancelDelete" class="btn-secondary">取消</button>
        </div>
      </div>
    </div>
    
    <!-- 隐藏的文件输入 -->
    <input 
      type="file" 
      ref="fileInput" 
      accept=".json" 
      style="display: none" 
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';

// 定义文件接口
interface ReportFile {
  id: string;
  name: string;
  content: string;
  lastModified: Date;
  createdAt: Date;
}

// 定义事件
const emit = defineEmits<{
  close: [];
  loadFile: [file: any];
  saveFile: [file: any];
  fileSelected: [file: ReportFile];
  fileCreated: [file: ReportFile];
  fileSaved: [file: ReportFile];
}>();

// 定义props
const props = defineProps<{
  currentFileName: string;
  currentFileData: any;
}>();

// 响应式数据
const files = ref<ReportFile[]>([]);
const currentFile = ref<ReportFile | null>(null);
const fileFilterText = ref('');
const showRenameDialog = ref(false);
const showDeleteDialog = ref(false);
const fileToRename = ref<ReportFile | null>(null);
const fileToDelete = ref<ReportFile | null>(null);
const newFileName = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const renameInput = ref<HTMLInputElement | null>(null);

// 计算属性
const filteredFiles = computed(() => {
  if (!fileFilterText.value) {
    return files.value;
  }
  return files.value.filter(file => 
    file.name.toLowerCase().includes(fileFilterText.value.toLowerCase())
  );
});

// 方法
const loadFilesFromStorage = () => {
  try {
    const storedFiles = localStorage.getItem('pdfDesignerFiles');
    if (storedFiles) {
      const parsedFiles = JSON.parse(storedFiles);
      files.value = parsedFiles.map((file: any) => ({
        ...file,
        lastModified: new Date(file.lastModified),
        createdAt: new Date(file.createdAt)
      }));
    }
  } catch (error) {
    console.error('加载文件列表失败:', error);
  }
};

const saveFilesToStorage = () => {
  try {
    localStorage.setItem('pdfDesignerFiles', JSON.stringify(files.value));
  } catch (error) {
    console.error('保存文件列表失败:', error);
  }
};

const createNewFile = () => {
  const timestamp = new Date().getTime();
  const newFile: ReportFile = {
    id: `file_${timestamp}`,
    name: `未命名报表${files.value.length + 1}`,
    content: JSON.stringify({
      reportProperties: {
        name: 'NewReport',
        pageWidth: 595,
        pageHeight: 842,
        leftMargin: 20,
        rightMargin: 20,
        topMargin: 20,
        bottomMargin: 20,
        defaultFont: {
          name: 'SansSerif',
          size: 12,
          isBold: false,
          isItalic: false,
          isUnderline: false
        }
      },
      bands: [
        { type: 'title', height: 50, elements: [] },
        { type: 'pageHeader', height: 50, elements: [] },
        { type: 'columnHeader', height: 30, elements: [] },
        { type: 'detail', height: 100, elements: [] },
        { type: 'columnFooter', height: 30, elements: [] },
        { type: 'pageFooter', height: 40, elements: [] },
        { type: 'summary', height: 60, elements: [] }
      ],
      reportFields: [],
      reportParameters: []
    }),
    lastModified: new Date(),
    createdAt: new Date()
  };
  
  files.value.push(newFile);
  saveFilesToStorage();
  selectFile(newFile);
  emit('fileCreated', newFile);
};

const selectFile = (file: ReportFile) => {
  currentFile.value = file;
  emit('fileSelected', file);
  
  // 通知PDFDesigner加载文件
  emit('loadFile', file);
};

const openLocalFile = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const timestamp = new Date().getTime();
      const newFile: ReportFile = {
        id: `file_${timestamp}`,
        name: file.name.replace('.json', ''),
        content,
        lastModified: new Date(),
        createdAt: new Date()
      };
      
      files.value.push(newFile);
      saveFilesToStorage();
      selectFile(newFile);
      emit('fileCreated', newFile);
    } catch (error) {
      console.error('读取文件失败:', error);
      alert('文件格式不正确，请选择有效的JSON文件');
    }
  };
  
  reader.readAsText(file);
  
  // 清空文件输入，以便可以再次选择同一个文件
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const saveCurrentFile = (content?: string) => {
  if (!currentFile.value) return;
  
  // 使用从PDFDesigner传递的文件数据
  const fileData = content || props.currentFileData;
  
  if (fileData) {
    currentFile.value.content = JSON.stringify(fileData);
  }
  
  currentFile.value.lastModified = new Date();
  saveFilesToStorage();
  emit('fileSaved', currentFile.value);
  
  // 通知PDFDesigner文件已保存
  emit('saveFile', fileData);
};

const saveAsLocalFile = (content?: string) => {
  if (!currentFile.value) return;
  
  // 使用从PDFDesigner传递的文件数据
  const fileData = content || props.currentFileData;
  const fileContent = fileData ? JSON.stringify(fileData, null, 2) : currentFile.value.content;
  
  const blob = new Blob([fileContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${currentFile.value.name}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

const renameFile = (file: ReportFile) => {
  fileToRename.value = file;
  newFileName.value = file.name;
  showRenameDialog.value = true;
  
  nextTick(() => {
    if (renameInput.value) {
      renameInput.value.focus();
      renameInput.value.select();
    }
  });
};

const confirmRename = () => {
  if (!fileToRename.value || !newFileName.value.trim()) return;
  
  fileToRename.value.name = newFileName.value.trim();
  fileToRename.value.lastModified = new Date();
  saveFilesToStorage();
  
  showRenameDialog.value = false;
  fileToRename.value = null;
  newFileName.value = '';
};

const cancelRename = () => {
  showRenameDialog.value = false;
  fileToRename.value = null;
  newFileName.value = '';
};

const deleteFile = (file: ReportFile) => {
  fileToDelete.value = file;
  showDeleteDialog.value = true;
};

const confirmDelete = () => {
  if (!fileToDelete.value) return;
  
  const index = files.value.findIndex(f => f.id === fileToDelete.value!.id);
  if (index !== -1) {
    files.value.splice(index, 1);
    saveFilesToStorage();
    
    // 如果删除的是当前文件，则清空当前文件
    if (currentFile.value && currentFile.value.id === fileToDelete.value.id) {
      currentFile.value = null;
    }
  }
  
  showDeleteDialog.value = false;
  fileToDelete.value = null;
};

const cancelDelete = () => {
  showDeleteDialog.value = false;
  fileToDelete.value = null;
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// 初始化
onMounted(() => {
  loadFilesFromStorage();
});
</script>

<style scoped>
.file-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--medium-margin);
}

.file-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--medium-margin);
}

.file-manager-header h3 {
  margin: 0;
  font-size: var(--font-size-large);
}

.file-actions {
  display: flex;
  gap: var(--small-gap);
}

.file-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: var(--border-radius);
  overflow: hidden;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--small-margin);
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.file-list-header h4 {
  margin: 0;
  font-size: var(--font-size-medium);
}

.file-filter {
  position: relative;
  width: 200px;
}

.filter-input {
  width: 100%;
  padding: 4px 24px 4px 8px;
  border: 1px solid #ccc;
  border-radius: var(--border-radius-small);
  font-size: var(--font-size-small);
}

.clear-filter-btn {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: var(--font-size-small);
  padding: 2px;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-filter-btn:hover {
  background-color: #f0f0f0;
  color: #666;
}

.file-list {
  flex: 1;
  overflow-y: auto;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--small-margin);
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.file-item:hover {
  background-color: #f5f5f5;
}

.file-item.active {
  background-color: #e6f7ff;
  border-color: #1890ff;
}

.file-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-date {
  font-size: var(--font-size-tiny);
  color: #666;
}

.file-item-actions {
  display: flex;
  gap: var(--small-gap);
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-medium);
  padding: 4px;
  border-radius: var(--border-radius-small);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background-color: #f0f0f0;
}

.btn-icon.btn-danger:hover {
  background-color: #ffebee;
  color: #f44336;
}

.empty-state {
  padding: var(--large-margin);
  text-align: center;
  color: #666;
}

.empty-state p {
  margin-bottom: var(--medium-margin);
}

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
  z-index: 1000;
}

.modal {
  background-color: white;
  border-radius: var(--border-radius);
  padding: var(--large-margin);
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal h3 {
  margin-top: 0;
  margin-bottom: var(--medium-margin);
}

.form-group {
  margin-bottom: var(--medium-margin);
}

.form-group label {
  display: block;
  margin-bottom: var(--small-margin);
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: var(--border-radius-small);
  font-size: var(--font-size-medium);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--small-gap);
}

/* CSS变量定义 */
:root {
  --small-margin: 8px;
  --medium-margin: 16px;
  --large-margin: 24px;
  --small-gap: 8px;
  --border-radius: 4px;
  --border-radius-small: 2px;
  --font-size-small: 12px;
  --font-size-medium: 14px;
  --font-size-large: 16px;
  --font-size-tiny: 10px;
}

.btn-primary {
  background-color: #1890ff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-small);
}

.btn-primary:hover {
  background-color: #40a9ff;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #d9d9d9;
  padding: 6px 12px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-small);
}

.btn-secondary:hover {
  background-color: #e6f7ff;
  border-color: #1890ff;
}

.btn-danger {
  background-color: #ff4d4f;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-small);
}

.btn-danger:hover {
  background-color: #ff7875;
}

.btn-small {
  padding: 4px 8px;
  font-size: var(--font-size-tiny);
}
</style>