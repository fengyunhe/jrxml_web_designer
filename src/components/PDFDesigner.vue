<template>
  <div class="pdf-designer">
    <div class="designer-header">
      <h1>PDF模板设计器</h1>
      <div class="header-actions">
        <button @click="toggleLeftPanel" class="btn-secondary">
          {{ showLeftPanel ? '隐藏左侧面板' : '显示左侧面板' }}
        </button>
        <button @click="toggleRightPanel" class="btn-secondary">
          {{ showRightPanel ? '隐藏右侧面板' : '显示右侧面板' }}
        </button>
        <button @click="toggleBottomPanel" class="btn-secondary">
          {{ showBottomPanel ? '隐藏底部面板' : '显示底部面板' }}
        </button>
        <button @click="clearLocalStorage" class="btn-secondary">清空本地数据</button>
        <button @click="generateJRXML" class="btn-primary">生成JRXML</button>
        <button @click="previewPDF" class="btn-secondary">预览</button>
      </div>
    </div>
    
    <div class="designer-layout">
      <!-- 左侧元素库 -->
      <div class="element-panel" v-show="showLeftPanel">
        <h3>元素库</h3>
        <div class="element-list">
          <div 
            v-for="element in elements" 
            :key="element.type"
            class="element-item"
            @dragstart="handleDragStart($event, element)"
            draggable="true"
          >
            {{ element.name }}
          </div>
        </div>
      </div>
      
      <!-- 中间设计区域 -->
      <div class="designer-canvas">
        <div class="paper" 
             :style="{ width: paperWidth + 'px', height: paperHeight + 'px' }"
             @drop="handleDrop"
             @dragover.prevent
             @dragenter.prevent
        >
          <!-- 报表区域 -->
          <div 
            v-for="(band, bandIndex) in bands" 
            :key="band.type"
            class="band"
            :style="{ height: band.height + 'px' }"
            @click="selectBand(bandIndex)"
            :class="{ 'selected': selectedBandIndex === bandIndex }"
          >
            <div class="band-header">
              <span>{{ band.type }}</span>
              <div class="band-actions">
                <button @click.stop="editBandHeight(bandIndex)">调整高度</button>
              </div>
            </div>
            <div class="band-content">
              <div 
            v-for="(item, index) in band.elements" 
            :key="index"
            class="design-element"
            :class="{ 'selected': selectedElement && selectedElement.bandIndex === bandIndex && selectedElement.elementIndex === index }"
            @click.stop="selectElement(bandIndex, index)"
            :style="{
              position: 'absolute',
              left: item.x + 'px',
              top: item.y + 'px',
              width: item.width + 'px',
              height: item.height + 'px',
              backgroundColor: item.backcolor || 'transparent',
              border: item.border || '1px solid #ccc'
            }"
            @mousedown="startDragging($event, bandIndex, index)"
          >
            <!-- 右下角调整大小手柄 -->
            <div 
              v-if="selectedElement && selectedElement.bandIndex === bandIndex && selectedElement.elementIndex === index"
              class="resize-handle"
              @mousedown.stop="startResizingElement($event, bandIndex, index)"
            ></div>
                <!-- 根据元素类型显示不同内容 -->
                <template v-if="item.type === 'staticText'">
                  <template v-if="editingElement && editingElement.bandIndex === bandIndex && editingElement.elementIndex === index">
                    <input 
                      v-model="item.text" 
                      type="text" 
                      class="inline-edit-input"
                      @blur="finishEditing"
                      @keyup.enter="finishEditing"
                      @keyup.esc="cancelEditing"
                      ref="editInput"
                    />
                  </template>
                  <template v-else>
                    <span @dblclick.stop="startEditing(bandIndex, index)">{{ item.text || '静态文本' }}</span>
                  </template>
                </template>
                <template v-else-if="item.type === 'textField'">
                  {{ item.expression || '字段: ' + item.fieldName }}
                </template>
                <template v-else-if="item.type === 'image'">
                  <div class="image-placeholder">图片</div>
                </template>
                <template v-else-if="item.type === 'line'">
                  <div class="line-element"></div>
                </template>
                <template v-else-if="item.type === 'rectangle'">
                  <div class="rectangle-element"></div>
                </template>
              </div>
            </div>
            <!-- 区域高度调整手柄 -->
            <div class="band-resize-handle" @mousedown.stop="startResizingBand($event, bandIndex)"></div>
          </div>
        </div>
      </div>
      
      <!-- 右侧属性面板 -->
      <div class="property-panel" v-show="showRightPanel">
        <h3>属性设置</h3>
        
        <!-- 报表属性 -->
        <div v-if="!selectedBandIndex && !selectedElement" class="property-section">
          <h4>报表属性</h4>
          <div class="form-group">
            <label>报表名称</label>
            <input v-model="reportProperties.name" type="text" />
          </div>
          <div class="form-group">
            <label>页面宽度</label>
            <input v-model.number="reportProperties.pageWidth" type="number" />
          </div>
          <div class="form-group">
            <label>页面高度</label>
            <input v-model.number="reportProperties.pageHeight" type="number" />
          </div>
          <div class="form-group">
            <label>左/右/上/下边距</label>
            <div class="margin-inputs">
              <input v-model.number="reportProperties.leftMargin" type="number" placeholder="左" />
              <input v-model.number="reportProperties.rightMargin" type="number" placeholder="右" />
              <input v-model.number="reportProperties.topMargin" type="number" placeholder="上" />
              <input v-model.number="reportProperties.bottomMargin" type="number" placeholder="下" />
            </div>
          </div>
        </div>
        
        <!-- 元素属性 -->
        <div v-else-if="selectedElement && currentElement" class="property-section">
          <h4>元素属性</h4>
          <div class="form-group">
            <label>X坐标</label>
            <input v-model.number="currentElement.x" type="number" />
          </div>
          <div class="form-group">
            <label>Y坐标</label>
            <input v-model.number="currentElement.y" type="number" />
          </div>
          <div class="form-group">
            <label>宽度</label>
            <input v-model.number="currentElement.width" type="number" />
          </div>
          <div class="form-group">
            <label>高度</label>
            <input v-model.number="currentElement.height" type="number" />
          </div>
          
          <!-- 根据元素类型显示特定属性 -->
          <template v-if="currentElement.type === 'staticText'">
            <div class="form-group">
              <label>文本内容</label>
              <textarea v-model="currentElement.text"></textarea>
            </div>
            <div class="form-group">
              <label>字体大小</label>
              <input v-model.number="currentElement.fontSize" type="number" />
            </div>
            <div class="form-group">
              <label>是否粗体</label>
              <input v-model="currentElement.isBold" type="checkbox" />
            </div>
          </template>
          
          <template v-else-if="currentElement.type === 'textField'">
            <div class="form-group">
              <label>字段名称</label>
              <input v-model="currentElement.fieldName" type="text" />
            </div>
            <div class="form-group">
              <label>表达式</label>
              <input v-model="currentElement.expression" type="text" />
            </div>
          </template>
          
          <button @click="deleteElement" class="btn-danger">删除元素</button>
        </div>
        
        <!-- 数据字段设置 -->
        <div class="property-section">
          <h4>数据字段</h4>
          <div v-for="(field, index) in reportFields" :key="index" class="field-item">
            <input v-model="field.name" placeholder="字段名" />
            <input v-model="field.class" placeholder="类型" />
            <button @click="removeField(index)" class="btn-small">删除</button>
          </div>
          <button @click="addField" class="btn-secondary btn-small">添加字段</button>
        </div>
      </div>
    </div>
    
    <!-- 底部标签页区域 -->
    <div class="tabs-container" v-show="showBottomPanel">
      <div class="tab-navigation">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-button" 
          :class="{ 'active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.name }}
        </button>
        <button @click="clearLocalStorage" class="btn-danger btn-small">清空本地数据</button>
      </div>
      
      <!-- 页面设置标签 -->
      <div class="tab-content page-settings-tab" v-show="activeTab === 'pageSettings'">
        <h3>页面设置</h3>
        <div class="settings-grid">
          <div class="form-group">
            <label>报表名称</label>
            <input v-model="reportProperties.name" type="text" />
          </div>
          <div class="form-group">
            <label>页面宽度</label>
            <input v-model.number="reportProperties.pageWidth" type="number" />
          </div>
          <div class="form-group">
            <label>页面高度</label>
            <input v-model.number="reportProperties.pageHeight" type="number" />
          </div>
          <div class="form-group">
            <label>左/右/上/下边距</label>
            <div class="margin-inputs">
              <input v-model.number="reportProperties.leftMargin" type="number" placeholder="左" />
              <input v-model.number="reportProperties.rightMargin" type="number" placeholder="右" />
              <input v-model.number="reportProperties.topMargin" type="number" placeholder="上" />
              <input v-model.number="reportProperties.bottomMargin" type="number" placeholder="下" />
            </div>
          </div>
          
          <!-- 字体设置 -->
          <div class="font-settings-section">
            <h4>默认字体设置</h4>
            <div class="form-group">
              <label>字体名称</label>
              <select v-model="reportProperties.defaultFont.name">
                <option value="SansSerif">SansSerif</option>
                <option value="Serif">Serif</option>
                <option value="Monospaced">Monospaced</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
              </select>
            </div>
            <div class="form-group">
              <label>字体大小</label>
              <input v-model.number="reportProperties.defaultFont.size" type="number" />
            </div>
            <div class="checkbox-group">
              <label>
                <input v-model="reportProperties.defaultFont.isBold" type="checkbox" />
                粗体
              </label>
              <label>
                <input v-model="reportProperties.defaultFont.isItalic" type="checkbox" />
                斜体
              </label>
              <label>
                <input v-model="reportProperties.defaultFont.isUnderline" type="checkbox" />
                下划线
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <!-- JRXML内容标签 -->
      <div class="tab-content jrxml-tab" v-show="activeTab === 'jrxml'">
        <div class="jrxml-container">
          <div class="jrxml-header">
            <h3>JRXML内容</h3>
            <button @click="copyJRXML" class="btn-secondary btn-small">复制</button>
          </div>
          <div class="jrxml-content">
            <pre v-if="jrxmlContent" class="jrxml-pre" spellcheck="false" style="user-select: text;">{{ jrxmlContent }}</pre>
            <div v-else class="jrxml-placeholder">点击"生成JRXML"按钮查看内容</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { generateJRXMLContent } from '../utils/jrxmlGenerator';

// 标签页相关
const activeTab = ref('pageSettings');
const tabs = ref([
  { id: 'pageSettings', name: '页面设置' },
  { id: 'jrxml', name: 'JRXML内容' }
]);

// 面板显示状态
const showLeftPanel = ref(true);
const showRightPanel = ref(true);
const showBottomPanel = ref(true);

// JRXML内容显示
const jrxmlContent = ref('');

// 报表属性
const reportProperties = ref({
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
});

// 可用元素
const elements = ref([
  { type: 'staticText', name: '静态文本' },
  { type: 'textField', name: '动态文本' },
  { type: 'image', name: '图片' },
  { type: 'line', name: '线条' },
  { type: 'rectangle', name: '矩形' }
]);

// 定义元素接口
interface DesignElement {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  fontSize?: number;
  isBold?: boolean;
  fieldName?: string;
  expression?: string;
  imagePath?: string;
  lineDirection?: string;
  lineWidth?: number;
  backcolor?: string;
  border?: string;
}

// 定义区域接口
interface Band {
  type: string;
  height: number;
  elements: DesignElement[];
}

// 报表区域
const bands = ref<Band[]>([
  { type: 'title', height: 80, elements: [] },
  { type: 'pageHeader', height: 50, elements: [] },
  { type: 'columnHeader', height: 30, elements: [] },
  { type: 'detail', height: 40, elements: [] },
  { type: 'columnFooter', height: 30, elements: [] },
  { type: 'pageFooter', height: 40, elements: [] },
  { type: 'summary', height: 60, elements: [] }
]);

// 数据字段
const reportFields = ref([
  { name: 'id', class: 'java.lang.String' },
  { name: 'name', class: 'java.lang.String' },
  { name: 'amount', class: 'java.math.BigDecimal' }
]);

// 选中状态
const selectedBandIndex = ref<number | null>(null);
const selectedElement = ref<{bandIndex: number, elementIndex: number} | null>(null);
const editingElement = ref<{bandIndex: number, elementIndex: number} | null>(null);
const editInput = ref<HTMLInputElement | null>(null);

// 计算属性
const paperWidth = computed(() => reportProperties.value.pageWidth);
const paperHeight = computed(() => reportProperties.value.pageHeight);
const currentElement = computed(() => {
  if (selectedElement.value) {
    const band = bands.value[selectedElement.value.bandIndex];
    if (band && band.elements) {
      return band.elements[selectedElement.value.elementIndex];
    }
  }
  return null;
});

// 拖拽相关
const draggingInfo = ref<{bandIndex: number, elementIndex: number, startX: number, startY: number} | null>(null);
// 调整大小相关
const resizingInfo = ref<{bandIndex: number, elementIndex: number, startX: number, startY: number, startWidth: number, startHeight: number} | null>(null);

// 处理拖放
const handleDragStart = (event: DragEvent, element: any) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(element));
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer) {
    const elementData = JSON.parse(event.dataTransfer.getData('application/json'));
    
    // 获取paper元素作为参考点
    const paper = document.querySelector('.paper') as HTMLElement;
    if (!paper) return;
    
    const paperRect = paper.getBoundingClientRect();
    // 计算相对于paper的坐标
    const x = event.clientX - paperRect.left;
    const y = event.clientY - paperRect.top;
    
    // 找到对应的band
    let bandIndex = 0;
    let currentY = 0;
    for (let i = 0; i < bands.value.length; i++) {
      const band = bands.value[i];
      if (band && y >= currentY && y <= currentY + band.height) {
        bandIndex = i;
        break;
      }
      if (band) {
        currentY += band.height;
      }
    }
    
    // 创建新元素
    const newElement: DesignElement = {
      type: elementData.type,
      // 计算在band中的精确位置，减去band-header的高度约24px
      x: Math.max(0, x - 50), // 减去元素宽度的一半以居中
      y: Math.max(0, y - currentY - 24), // 减去band-header的高度
      width: 100,
      height: 30,
      ...getDefaultElementProperties(elementData.type)
    };
    
    const targetBand = bands.value[bandIndex];
    if (targetBand && targetBand.elements) {
      // 确保元素不会超出band边界
      if (newElement.x + newElement.width > paperWidth.value) {
        newElement.x = paperWidth.value - newElement.width;
      }
      if (newElement.y + newElement.height > targetBand.height) {
        newElement.y = targetBand.height - newElement.height;
      }
      targetBand.elements.push(newElement);
    }
  }
};

// 获取元素默认属性
const getDefaultElementProperties = (type: string): Partial<DesignElement> => {
  switch (type) {
    case 'staticText':
      return { text: '静态文本', fontSize: 12, isBold: false };
    case 'textField':
      return { fieldName: '', expression: '' };
    case 'image':
      return { imagePath: '' };
    case 'line':
      return { lineDirection: 'Horizontal', lineWidth: 1 };
    case 'rectangle':
      return { backcolor: '#f0f0f0' };
    default:
      return {};
  }
};

// 选择区域
const selectBand = (index: number) => {
  selectedBandIndex.value = index;
  selectedElement.value = null;
};

// 选择元素
const selectElement = (bandIndex: number, elementIndex: number) => {
  selectedElement.value = { bandIndex, elementIndex };
  selectedBandIndex.value = null;
};

// 开始拖拽元素
const startDragging = (event: MouseEvent, bandIndex: number, elementIndex: number) => {
  event.stopPropagation();
  selectElement(bandIndex, elementIndex);
  
  const band = bands.value[bandIndex];
  const element = band?.elements[elementIndex];
  
  if (element) {
    draggingInfo.value = {
      bandIndex,
      elementIndex,
      startX: event.clientX - element.x,
      startY: event.clientY - element.y
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingInfo.value) {
        const currentBand = bands.value[draggingInfo.value.bandIndex];
        const currentElement = currentBand?.elements[draggingInfo.value.elementIndex];
        
        if (currentBand && currentElement) {
          currentElement.x = Math.max(0, Math.min(e.clientX - draggingInfo.value.startX, paperWidth.value - currentElement.width));
          currentElement.y = Math.max(0, Math.min(e.clientY - draggingInfo.value.startY, currentBand.height - currentElement.height));
        }
      }
    };
    
    const handleMouseUp = () => {
      draggingInfo.value = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
};

// 编辑区域高度
const editBandHeight = (index: number) => {
  const band = bands.value[index];
  if (band) {
    const newHeight = prompt('请输入新的高度:', band.height.toString());
    if (newHeight && !isNaN(Number(newHeight))) {
      band.height = Number(newHeight);
    }
  }
};

// 添加字段
const addField = () => {
  reportFields.value.push({ name: '', class: 'java.lang.String' });
};

// 删除字段
const removeField = (index: number) => {
  reportFields.value.splice(index, 1);
};

// 删除元素
const deleteElement = () => {
  if (selectedElement.value) {
    const { bandIndex, elementIndex } = selectedElement.value;
    const band = bands.value[bandIndex];
    if (band && band.elements) {
      band.elements.splice(elementIndex, 1);
      selectedElement.value = null;
    }
  }
};

// 开始编辑静态文本
const startEditing = (bandIndex: number, elementIndex: number) => {
  editingElement.value = { bandIndex, elementIndex };
  // 选择该元素
  selectElement(bandIndex, elementIndex);
  
  // 等待DOM更新后聚焦输入框
  setTimeout(() => {
    if (editInput.value) {
      editInput.value.focus();
      editInput.value.select();
    }
  }, 10);
};

// 完成编辑
const finishEditing = () => {
  editingElement.value = null;
  // 保存数据
  saveToLocalStorage();
  updateJRXML();
};

// 取消编辑
const cancelEditing = () => {
  editingElement.value = null;
};

// 保存数据到localStorage
const saveToLocalStorage = () => {
  try {
    const dataToSave = {
      reportProperties: reportProperties.value,
      bands: bands.value,
      reportFields: reportFields.value,
      jrxmlContent: jrxmlContent.value
    };
    localStorage.setItem('pdfDesignerData', JSON.stringify(dataToSave));
    console.log('数据已保存到localStorage');
  } catch (error) {
    console.error('保存到localStorage失败:', error);
  }
};

// 从localStorage加载数据
const loadFromLocalStorage = () => {
  try {
    const savedData = localStorage.getItem('pdfDesignerData');
    if (savedData) {
      const data = JSON.parse(savedData);
      if (data.reportProperties) reportProperties.value = data.reportProperties;
      if (data.bands) bands.value = data.bands;
      if (data.reportFields) reportFields.value = data.reportFields;
      if (data.jrxmlContent) jrxmlContent.value = data.jrxmlContent;
      console.log('从localStorage恢复数据成功');
    }
  } catch (error) {
    console.error('从localStorage加载失败:', error);
  }
};

// 清空localStorage数据
const clearLocalStorage = () => {
  if (confirm('确定要清空所有本地数据吗？此操作不可恢复。')) {
    localStorage.removeItem('pdfDesignerData');
    alert('本地数据已清空');
    location.reload();
  }
};

// 生成JRXML
const generateJRXML = () => {
  const content = generateJRXMLContent(reportProperties.value, bands.value, reportFields.value);
  jrxmlContent.value = content;
  
  // 自动切换到JRXML标签页
  activeTab.value = 'jrxml';
  
  // 创建下载链接
  const blob = new Blob([content], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reportProperties.value.name}.jrxml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  // 保存数据
  saveToLocalStorage();
};

// 面板显示控制函数
const toggleLeftPanel = () => {
  showLeftPanel.value = !showLeftPanel.value;
};

const toggleRightPanel = () => {
  showRightPanel.value = !showRightPanel.value;
};

const toggleBottomPanel = () => {
  showBottomPanel.value = !showBottomPanel.value;
};

// 自动更新JRXML内容
const updateJRXML = () => {
  try {
    const content = generateJRXMLContent(reportProperties.value, bands.value, reportFields.value);
    jrxmlContent.value = content;
  } catch (error) {
    console.error('更新JRXML失败:', error);
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadFromLocalStorage();
  // 初始加载后更新JRXML
  updateJRXML();
});

// 监听关键数据变化，自动保存和更新JRXML
watch(
  [reportProperties, bands, reportFields],
  () => {
    saveToLocalStorage();
    updateJRXML();
  },
  { deep: true }
);

// 复制JRXML内容到剪贴板
const copyJRXML = () => {
  navigator.clipboard.writeText(jrxmlContent.value).then(() => {
    // 可以添加一个提示，告诉用户复制成功
    alert('JRXML内容已复制到剪贴板');
  }).catch(err => {
    console.error('复制失败:', err);
  });
};



// 开始调整band高度
const startResizingBand = (event: MouseEvent, bandIndex: number) => {
  event.preventDefault();
  
  const startY = event.clientY;
  const startHeight = bands.value[bandIndex].height;
  
  const handleMouseMove = (e: MouseEvent) => {
    const deltaY = e.clientY - startY;
    const newHeight = Math.max(20, startHeight + deltaY);
    bands.value[bandIndex].height = newHeight;
    
    // 调整该区域内元素的位置，确保元素不会超出区域边界
    const band = bands.value[bandIndex];
    if (band && band.elements) {
      band.elements.forEach(element => {
        if (element.y + element.height > newHeight) {
          element.y = newHeight - element.height;
          if (element.y < 0) element.y = 0;
        }
      });
    }
  };
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

// 开始调整元素大小
const startResizingElement = (event: MouseEvent, bandIndex: number, elementIndex: number) => {
  event.preventDefault();
  
  const band = bands.value[bandIndex];
  const element = band?.elements[elementIndex];
  
  if (element) {
    resizingInfo.value = {
      bandIndex,
      elementIndex,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: element.width,
      startHeight: element.height
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingInfo.value) {
        const currentBand = bands.value[resizingInfo.value.bandIndex];
        const currentElement = currentBand?.elements[resizingInfo.value.elementIndex];
        
        if (currentBand && currentElement) {
          // 计算新的宽度和高度
          let newWidth = resizingInfo.value.startWidth + (e.clientX - resizingInfo.value.startX);
          let newHeight = resizingInfo.value.startHeight + (e.clientY - resizingInfo.value.startY);
          
          // 限制最小尺寸
          newWidth = Math.max(20, newWidth);
          newHeight = Math.max(20, newHeight);
          
          // 限制不能超出纸张和band边界
          newWidth = Math.min(newWidth, paperWidth.value - currentElement.x);
          newHeight = Math.min(newHeight, currentBand.height - currentElement.y);
          
          currentElement.width = newWidth;
          currentElement.height = newHeight;
        }
      }
    };
    
    const handleMouseUp = () => {
      resizingInfo.value = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
};

// 预览PDF
const previewPDF = () => {
  alert('预览功能开发中...');
};
</script>

<style scoped>
.pdf-designer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: Arial, sans-serif;
}

.designer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.designer-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* 面板切换时的过渡样式 */
.element-panel,
.property-panel {
  transition: width 0.3s ease;
  overflow: hidden;
}

/* 当左右面板隐藏时，中间设计区域扩展 */
.designer-canvas {
  flex: 1;
  transition: all 0.3s ease;
}

/* 底部面板的过渡样式 */
.tabs-container {
  transition: height 0.3s ease;
  overflow: hidden;
}

.element-panel {
  width: 200px;
  padding: 1rem;
  background-color: #f8f9fa;
  border-right: 1px solid #ddd;
  overflow-y: auto;
}

.element-item {
  padding: 0.5rem;
  margin: 0.5rem 0;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: grab;
  text-align: center;
}

.element-item:hover {
  background-color: #e9ecef;
}

.designer-canvas {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
  background-color: #f0f0f0;
  overflow: auto;
}

.paper {
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  position: relative;
  overflow: hidden;
}

.band {  
  border-bottom: 1px dashed #ccc;
  position: relative;
  min-height: 20px;
}

.band-resize-handle {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  cursor: ns-resize;
  background-color: transparent;
}

.band-resize-handle:hover {
  background-color: rgba(25, 118, 210, 0.1);
}

.band-resize-handle::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 2px;
  background-color: #1976d2;
  opacity: 0;
}

.band-resize-handle:hover::before {
  opacity: 1;
}

.band.selected {
  background-color: #e3f2fd;
}

.band-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background-color: #f5f5f5;
  font-size: 0.8rem;
  font-weight: bold;
  color: #666;
}

.band-content {
  position: relative;
  width: 100%;
  height: calc(100% - 24px);
}

.design-element {
  position: absolute;
  cursor: move;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}

/* 内联编辑输入框样式 */
.inline-edit-input {
  width: 100%;
  height: 100%;
  padding: 5px;
  border: 1px solid #4a90e2;
  border-radius: 2px;
  background-color: white;
  font-size: inherit;
  font-family: inherit;
  text-align: center;
  box-sizing: border-box;
  outline: none;
  cursor: text;
}

.design-element.selected {
  border: 2px solid #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

/* 调整大小手柄样式 */
.resize-handle {
  position: absolute;
  right: -5px;
  bottom: -5px;
  width: 10px;
  height: 10px;
  background-color: #1976d2;
  border: 1px solid white;
  border-radius: 2px;
  cursor: se-resize;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.resize-handle:hover {
  background-color: #1565c0;
}

.property-panel {
  width: 300px;
  padding: 1rem;
  background-color: #f8f9fa;
  border-left: 1px solid #ddd;
  overflow-y: auto;
}

.property-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.margin-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 0.5rem;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-primary {
  background-color: #1976d2;
  color: white;
}

.btn-secondary {
    background-color: #6c757d;
    color: white;
  }

  .btn-danger {
    background-color: #dc3545;
    color: white;
  }

  .btn-small {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
  }
  
  /* 按钮在标签导航中的样式 */
  .tab-navigation .btn-danger.btn-small {
    margin-left: auto;
    margin-right: 10px;
    align-self: center;
  }

.field-item {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.field-item input {
  flex: 1;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  color: #666;
}

.line-element {
  width: 100%;
  height: 1px;
  background-color: #333;
}

.rectangle-element {
  width: 100%;
  height: 100%;
}

/* 标签页相关样式 */
.tabs-container {
  background-color: #f5f5f5;
  border-top: 1px solid #ddd;
}

.tab-navigation {
  display: flex;
  background-color: #e9e9e9;
  border-bottom: 1px solid #ddd;
  padding: 0 10px;
}

.tab-button {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.tab-button.active {
  border-bottom-color: #4a90e2;
  color: #4a90e2;
  font-weight: bold;
}

.tab-button:hover:not(.active) {
  background-color: #f0f0f0;
}

.tab-content {
  padding: 20px;
  min-height: 300px;
}

/* 页面设置标签样式 */
.page-settings-tab {
  background-color: white;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.margin-inputs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.font-settings-section {
  grid-column: 1 / -1;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 6px;
  margin-top: 10px;
}

.font-settings-section h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.checkbox-group {
  display: flex;
  gap: 20px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 0;
  font-weight: normal;
}

/* JRXML标签样式 */
.jrxml-tab {
  background-color: white;
}

.jrxml-container {
  background-color: #f5f5f5;
  border-radius: 6px;
  overflow: hidden;
}

.jrxml-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #e9e9e9;
  border-bottom: 1px solid #ddd;
}

.jrxml-content {
  height: 400px;
  overflow: auto;
}

.jrxml-pre {
  margin: 0;
  padding: 15px;
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  white-space: pre-wrap;
  word-wrap: break-word;
  min-height: 100%;
  user-select: text;
  cursor: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  border: none;
  outline: none;
  overflow-wrap: break-word;
}

.jrxml-placeholder {
  padding: 40px 20px;
  text-align: center;
  color: #999;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>