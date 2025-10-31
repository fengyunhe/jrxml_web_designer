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
        
        <!-- 数据字段区域 - 移到左侧面板 -->
        <div class="data-fields-section">
          <h4>数据字段</h4>
          <div class="fields-mini-view">
            <div v-for="(field, index) in reportFields" :key="index" class="field-mini-item">
              <span class="field-name">$F{ {{ field.name }} }</span>
              <span class="field-type">({{ field.class }})</span>
            </div>
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
              <input 
                v-model.number="band.height" 
                type="number" 
                class="band-height-input"
                min="20"
                @change="updateBandHeight(bandIndex)"
                @blur="updateBandHeight(bandIndex)"
              />

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
              paddingTop: item.box?.topPadding ? `${item.box.topPadding}px` : (item.box?.padding ? `${item.box.padding}px` : undefined),
              paddingLeft: item.box?.leftPadding ? `${item.box.leftPadding}px` : (item.box?.padding ? `${item.box.padding}px` : undefined),
              paddingBottom: item.box?.bottomPadding ? `${item.box.bottomPadding}px` : (item.box?.padding ? `${item.box.padding}px` : undefined),
              paddingRight: item.box?.rightPadding ? `${item.box.rightPadding}px` : (item.box?.padding ? `${item.box.padding}px` : undefined),
              borderTop: getBorderStyle('top', item.box) || (item.border || item.box ? '1px solid #ccc' : '1px solid transparent'),
              borderLeft: getBorderStyle('left', item.box) || (item.border || item.box ? '1px solid #ccc' : '1px solid transparent'),
              borderBottom: getBorderStyle('bottom', item.box) || (item.border || item.box ? '1px solid #ccc' : '1px solid transparent'),
              borderRight: getBorderStyle('right', item.box) || (item.border || item.box ? '1px solid #ccc' : '1px solid transparent'),
              fontFamily: item.fontFamily || reportProperties.defaultFont.name,
              fontSize: item.fontSize ? `${item.fontSize}px` : `${reportProperties.defaultFont.size}px`,
              fontWeight: item.isBold !== undefined ? (item.isBold ? 'bold' : 'normal') : (reportProperties.defaultFont.isBold ? 'bold' : 'normal'),
              fontStyle: item.isItalic !== undefined ? (item.isItalic ? 'italic' : 'normal') : (reportProperties.defaultFont.isItalic ? 'italic' : 'normal'),
              textDecoration: item.isUnderline !== undefined ? (item.isUnderline ? 'underline' : 'none') : (reportProperties.defaultFont.isUnderline ? 'underline' : 'none')
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
          <!-- 元素属性标签页 -->
          <div class="element-tabs">
            <div class="element-tab-navigation">
              <button 
                v-for="tab in elementTabs" 
                :key="tab.id"
                class="element-tab-button" 
                :class="{ 'active': activeElementTab === tab.id }"
                @click="activeElementTab = tab.id"
              >
                {{ tab.name }}
              </button>
            </div>
            
            <!-- 基本属性标签页 -->
            <div class="element-tab-content" v-show="activeElementTab === 'basic'">
              <h4>基本属性</h4>
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
                  <small>例如: $F{字段名} 或 $F{字段名}.toString()</small>
                </div>
                <div class="form-group">
                  <label>格式模式</label>
                  <input v-model="currentElement.pattern" type="text" />
                  <small>例如: 日期格式 "yyyy-MM-dd"，数字格式 "#,##0.00"</small>
                </div>
                <div class="form-group">
                  <label>文本对齐</label>
                  <select v-model="currentElement.textAlignment">
                    <option value="Left">左对齐</option>
                    <option value="Center">居中</option>
                    <option value="Right">右对齐</option>
                    <option value="Justified">两端对齐</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>垂直对齐</label>
                  <select v-model="currentElement.verticalAlignment">
                    <option value="Top">顶部</option>
                    <option value="Middle">中间</option>
                    <option value="Bottom">底部</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>字体大小</label>
                  <input v-model.number="currentElement.fontSize" type="number" />
                </div>
                <div class="checkbox-group">
                  <label>
                    <input v-model="currentElement.isBold" type="checkbox" />
                    粗体
                  </label>
                  <label>
                    <input v-model="currentElement.isItalic" type="checkbox" />
                    斜体
                  </label>
                  <label>
                    <input v-model="currentElement.isUnderline" type="checkbox" />
                    下划线
                  </label>
                </div>
                <div class="form-group">
                  <label>
                    <input v-model="currentElement.isStretchWithOverflow" type="checkbox" />
                    内容超出时自动拉伸
                  </label>
                </div>
                <div class="form-group">
                  <label>
                    <input v-model="currentElement.isBlankWhenNull" type="checkbox" />
                    值为null时显示空白
                  </label>
                </div>
                <div class="form-group">
                  <label>表达式计算时机</label>
                  <select v-model="currentElement.evaluationTime">
                    <option value="Now">当前</option>
                    <option value="Report">报表结束时</option>
                    <option value="Page">页结束时</option>
                    <option value="Column">列结束时</option>
                    <option value="Group">组结束时</option>
                    <option value="Band">区域渲染时</option>
                    <option value="Auto">自动</option>
                  </select>
                </div>
              </template>
            </div>
            
            <!-- Box设置标签页 -->
            <div class="element-tab-content" v-show="activeElementTab === 'box'">
              <h4>Box设置</h4>
              
              <!-- 初始化box对象（如果不存在） -->
              <div v-if="!currentElement.box" class="init-box-section">
                <button @click="initBox()" class="btn-secondary btn-small">初始化Box设置</button>
              </div>
              
              <template v-if="currentElement.box">
                <!-- 全局边框设置 -->
                <div class="box-section">
                  <h5>全局边框</h5>
                  <div class="form-group">
                    <label>边框样式</label>
                    <select v-model="currentElement.box.border">
                      <option value="">无</option>
                      <option value="Thin">细线 (1px)</option>
                      <option value="Medium">中等 (2px)</option>
                      <option value="Thick">粗线 (3px)</option>
                      <option value="Dashed">虚线</option>
                      <option value="Dotted">点线</option>
                      <option value="Double">双线</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>边框颜色</label>
                    <input v-model="currentElement.box.borderColor" type="color" />
                  </div>
                </div>
                
                <!-- 各边边框设置 -->
                <div class="box-section">
                  <h5>各边边框（覆盖全局设置）</h5>
                  
                  <!-- 上边 -->
                  <div class="border-side-group">
                    <label class="side-label">上边</label>
                    <select v-model="currentElement.box.topBorder" class="side-control">
                      <option value="">使用全局</option>
                      <option value="Thin">细线 (1px)</option>
                      <option value="Medium">中等 (2px)</option>
                      <option value="Thick">粗线 (3px)</option>
                      <option value="Dashed">虚线</option>
                      <option value="Dotted">点线</option>
                      <option value="Double">双线</option>
                    </select>
                    <input v-model="currentElement.box.topBorderColor" type="color" class="color-control" />
                  </div>
                  
                  <!-- 左边 -->
                  <div class="border-side-group">
                    <label class="side-label">左边</label>
                    <select v-model="currentElement.box.leftBorder" class="side-control">
                      <option value="">使用全局</option>
                      <option value="Thin">细线 (1px)</option>
                      <option value="Medium">中等 (2px)</option>
                      <option value="Thick">粗线 (3px)</option>
                      <option value="Dashed">虚线</option>
                      <option value="Dotted">点线</option>
                      <option value="Double">双线</option>
                    </select>
                    <input v-model="currentElement.box.leftBorderColor" type="color" class="color-control" />
                  </div>
                  
                  <!-- 下边 -->
                  <div class="border-side-group">
                    <label class="side-label">下边</label>
                    <select v-model="currentElement.box.bottomBorder" class="side-control">
                      <option value="">使用全局</option>
                      <option value="Thin">细线 (1px)</option>
                      <option value="Medium">中等 (2px)</option>
                      <option value="Thick">粗线 (3px)</option>
                      <option value="Dashed">虚线</option>
                      <option value="Dotted">点线</option>
                      <option value="Double">双线</option>
                    </select>
                    <input v-model="currentElement.box.bottomBorderColor" type="color" class="color-control" />
                  </div>
                  
                  <!-- 右边 -->
                  <div class="border-side-group">
                    <label class="side-label">右边</label>
                    <select v-model="currentElement.box.rightBorder" class="side-control">
                      <option value="">使用全局</option>
                      <option value="Thin">细线 (1px)</option>
                      <option value="Medium">中等 (2px)</option>
                      <option value="Thick">粗线 (3px)</option>
                      <option value="Dashed">虚线</option>
                      <option value="Dotted">点线</option>
                      <option value="Double">双线</option>
                    </select>
                    <input v-model="currentElement.box.rightBorderColor" type="color" class="color-control" />
                  </div>
                </div>
                
                <!-- 边距设置 -->
                <div class="box-section">
                  <h5>边距设置</h5>
                  <div class="form-group">
                    <label>全局边距（像素）</label>
                    <input v-model.number="currentElement.box.padding" type="number" placeholder="全部边距" />
                    <small>设置后会覆盖各边独立设置</small>
                  </div>
                  
                  <div class="padding-grid">
                    <div class="form-group">
                      <label>上边距</label>
                      <input v-model.number="currentElement.box.topPadding" type="number" />
                    </div>
                    <div class="form-group">
                      <label>左边距</label>
                      <input v-model.number="currentElement.box.leftPadding" type="number" />
                    </div>
                    <div class="form-group">
                      <label>下边距</label>
                      <input v-model.number="currentElement.box.bottomPadding" type="number" />
                    </div>
                    <div class="form-group">
                      <label>右边距</label>
                      <input v-model.number="currentElement.box.rightPadding" type="number" />
                    </div>
                  </div>
                </div>
              </template>
            </div>
            
            <!-- 样式设置标签页 -->
            <div class="element-tab-content" v-show="activeElementTab === 'style'">
              <h4>样式设置</h4>
              <div class="form-group">
                <label>背景颜色</label>
                <input v-model="currentElement.backcolor" type="color" />
              </div>
              
              <template v-if="currentElement.type !== 'line' && currentElement.type !== 'image'">
                <div class="form-group">
                  <label>字体名称</label>
                  <select v-model="currentElement.fontFamily">
                    <option value="">使用默认字体</option>
                    <option value="SansSerif">SansSerif</option>
                    <option value="Serif">Serif</option>
                    <option value="Monospaced">Monospaced</option>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                  </select>
                </div>
                
                <div class="checkbox-group">
                  <label>
                    <input v-model="currentElement.isBold" type="checkbox" />
                    粗体
                  </label>
                  <label>
                    <input v-model="currentElement.isItalic" type="checkbox" />
                    斜体
                  </label>
                  <label>
                    <input v-model="currentElement.isUnderline" type="checkbox" />
                    下划线
                  </label>
                </div>
              </template>
            </div>
          </div>
          
          <div class="element-actions">
            <button @click="deleteElement" class="btn-danger">删除元素</button>
          </div>
        </div>
        

      </div>
    </div>
    
    <!-- 底部标签页区域 -->
    <div class="tabs-container" v-show="showBottomPanel" :style="{ height: bottomPanelHeight + 'px' }">
      <!-- 顶部调整手柄 -->
      <div class="tabs-resize-handle" @mousedown.stop="startResizingBottomPanel"></div>
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
            <div class="jrxml-actions">
              <button @click="copyJRXML" class="btn-secondary btn-small">复制</button>
              <button @click="saveJRXML" class="btn-primary btn-small">保存编辑</button>
              <button @click="regenerateJRXML" class="btn-secondary btn-small">重新生成</button>
            </div>
          </div>
          <div class="jrxml-content">
            <textarea 
              v-if="jrxmlContent" 
              v-model="jrxmlContent" 
              class="jrxml-editor" 
              spellcheck="false"
              @keyup.ctrl.s.prevent="saveJRXML"
            ></textarea>
            <div v-else class="jrxml-placeholder">点击"生成JRXML"按钮查看内容</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 框选区域可视化 -->
  <div 
    v-if="isMultiSelecting" 
    class="selection-box" 
    :style="{
      left: selectionBox.x + 'px',
      top: selectionBox.y + 'px',
      width: selectionBox.width + 'px',
      height: selectionBox.height + 'px'
    }"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

// 确保浏览器环境中DOMParser可用
const getDOMParser = (): DOMParser => {
  if (typeof window !== 'undefined' && window.DOMParser) {
    return new DOMParser();
  }
  throw new Error('当前环境不支持DOMParser，无法解析XML');
};
import { generateJRXMLContent, parseJRXMLContent } from '../utils/jrxmlGenerator';

// 标签页相关
const activeTab = ref('pageSettings');
const tabs = ref([
  { id: 'pageSettings', name: '页面设置' },
  { id: 'jrxml', name: 'JRXML内容' }
]);

// 元素属性标签页相关
const activeElementTab = ref('basic');
const elementTabs = ref([
  { id: 'basic', name: '基本属性' },
  { id: 'box', name: 'Box设置' },
  { id: 'style', name: '样式设置' }
]);

// 面板显示状态
const showLeftPanel = ref(true);
const showRightPanel = ref(true);
const showBottomPanel = ref(true);
// 底部面板高度
const bottomPanelHeight = ref(400); // 默认高度400px

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
  },
  
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
interface Pen {
  lineWidth?: number;
  lineStyle?: string;
  lineColor?: string;
}

interface Box {
  topPadding?: number;
  leftPadding?: number;
  bottomPadding?: number;
  rightPadding?: number;
  padding?: number;
  topPen?: Pen;
  leftPen?: Pen;
  bottomPen?: Pen;
  rightPen?: Pen;
  border?: string;
  borderColor?: string;
  topBorder?: string;
  topBorderColor?: string;
  leftBorder?: string;
  leftBorderColor?: string;
  bottomBorder?: string;
  bottomBorderColor?: string;
  rightBorder?: string;
  rightBorderColor?: string;
}

interface DesignElement {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  unit?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  fieldName?: string;
  expression?: string;
  imagePath?: string;
  lineDirection?: string;
  lineWidth?: number;
  backcolor?: string;
  border?: string;
  box?: Box;
  // 动态字段特有属性
  isStretchWithOverflow?: boolean;
  evaluationTime?: string;
  pattern?: string;
  isBlankWhenNull?: boolean;
  hyperlinkType?: string;
  hyperlinkTarget?: string;
  textAlignment?: string;
  verticalAlignment?: string;
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
  { type: 'detail', height: 100, elements: [] }, // 默认给detail区域100的高度
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
  // 使用报表的默认字体设置
  const defaultFontProps = {
    fontFamily: reportProperties.value.defaultFont.name,
    fontSize: reportProperties.value.defaultFont.size,
    isBold: reportProperties.value.defaultFont.isBold,
    isItalic: reportProperties.value.defaultFont.isItalic,
    isUnderline: reportProperties.value.defaultFont.isUnderline
  };
  
  switch (type) {
    case 'staticText':
      return { 
        text: '静态文本', 
        ...defaultFontProps
      };
    case 'textField':
      return {
        fieldName: '', 
        expression: '',
        isStretchWithOverflow: false,
        evaluationTime: 'Now',
        pattern: '',
        isBlankWhenNull: false,
        ...defaultFontProps,
        textAlignment: 'Left',
        verticalAlignment: 'Top'
      };
    case 'image':
      return { imagePath: '' };
    case 'line':
      return { lineDirection: 'Horizontal', lineWidth: 1 };
    case 'rectangle':
      return { 
        backcolor: '#f0f0f0',
        border: '1px solid #ccc' // 为矩形元素默认添加边框
      };
    default:
      return {};
  }
};

// 选择区域
const selectBand = (index: number) => {
  selectedBandIndex.value = index;
  selectedElement.value = null;
  // 自动隐藏底部面板
  showBottomPanel.value = false;
};

// 选择元素
const selectElement = (bandIndex: number, elementIndex: number) => {
  selectedElement.value = { bandIndex, elementIndex };
  selectedBandIndex.value = null;
  // 自动隐藏底部面板
  showBottomPanel.value = false;
};

// 开始拖拽元素
const startDragging = (event: MouseEvent, bandIndex: number, elementIndex: number) => {
  event.stopPropagation();
  selectElement(bandIndex, elementIndex);
  
  // 自动隐藏底部面板
  showBottomPanel.value = false;
  
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



// 获取边框样式 - 优化边框颜色和粗细的处理
const getBorderStyle = (side: string, box?: Box): string | undefined => {
  if (!box) return undefined;
  
  // 优先使用sideBorder属性
  const borderProperty = side === 'top' ? box.topBorder : 
                       side === 'left' ? box.leftBorder : 
                       side === 'bottom' ? box.bottomBorder : 
                       box.rightBorder;
  
  // 如果没有sideBorder但有border，使用border
  const border = borderProperty || box.border;
  if (!border) return undefined;
  
  // 获取边框颜色 - 确保始终有颜色
  const colorProperty = side === 'top' ? box.topBorderColor : 
                       side === 'left' ? box.leftBorderColor : 
                       side === 'bottom' ? box.bottomBorderColor : 
                       box.rightBorderColor;
  const color = colorProperty || box.borderColor || '#000000'; // 确保有默认颜色
  
  // 获取线宽 - 确保粗细正确
  let width = '1px'; // 默认宽度
  const penProperty = side === 'top' ? box.topPen : 
                      side === 'left' ? box.leftPen : 
                      side === 'bottom' ? box.bottomPen : 
                      box.rightPen;
  if (penProperty?.lineWidth !== undefined) {
    width = `${penProperty.lineWidth}px`;
  } else if (border === 'Thin' || border === '1Point') {
    width = '1px';
  } else if (border === '2Point' || border === 'Medium') {
    width = '2px';
  } else if (border === '4Point' || border === 'Thick') {
    width = '4px';
  }
  
  // 获取线型
  let style = 'solid'; // 默认实线
  if (penProperty?.lineStyle) {
    if (penProperty.lineStyle === 'Dashed') style = 'dashed';
    else if (penProperty.lineStyle === 'Dotted') style = 'dotted';
    else if (penProperty.lineStyle === 'Double') style = 'double';
  }
  
  // 确保返回完整的边框样式，包括颜色、粗细和样式
  return `${width} ${style} ${color}`;
};

// 更新区域高度
const updateBandHeight = (bandIndex: number) => {
  const band = bands.value[bandIndex];
  if (band) {
    // 确保高度不小于最小值
    band.height = Math.max(20, band.height);
    
    // 调整该区域内元素的位置，确保元素不会超出区域边界
    if (band.elements) {
      band.elements.forEach(element => {
        if (element.y + element.height > band.height) {
          element.y = band.height - element.height;
          if (element.y < 0) element.y = 0;
        }
      });
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
  
  // 自动隐藏底部面板
  showBottomPanel.value = false;
  
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

// 初始化元素的Box属性
const initBox = () => {
  if (currentElement.value) {
    // 创建一个默认的box对象
    currentElement.value.box = {
      // 全局边框
      border: '',
      borderColor: '#000000',
      
      // 各边边框
      topBorder: '',
      topBorderColor: '#000000',
      leftBorder: '',
      leftBorderColor: '#000000',
      bottomBorder: '',
      bottomBorderColor: '#000000',
      rightBorder: '',
      rightBorderColor: '#000000',
      
      // 边距
      padding: 0,
      topPadding: 0,
      leftPadding: 0,
      bottomPadding: 0,
      rightPadding: 0
    };
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

// 开始调整底部面板高度
const startResizingBottomPanel = (event: MouseEvent): void => {
  event.preventDefault();
  
  const startY = event.clientY;
  const startHeight = bottomPanelHeight.value;
  
  const handleMouseMove = (e: MouseEvent): void => {
    // 计算高度变化（鼠标向上移动增加高度，向下移动减少高度）
    const deltaY = startY - e.clientY;
    const newHeight = Math.max(100, Math.min(800, startHeight + deltaY)); // 限制最小100px，最大800px
    bottomPanelHeight.value = newHeight;
  };
  
  const handleMouseUp = (): void => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
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

// 框选相关变量
const isMultiSelecting = ref(false);
const selectionBox = ref({ x: 0, y: 0, width: 0, height: 0 });
const selectedElements = ref<{bandIndex: number, elementIndex: number}[]>([]);

// 组件挂载时加载数据
onMounted(() => {
  loadFromLocalStorage();
  // 初始加载后更新JRXML
  updateJRXML();
  
  // 添加键盘事件监听器
  const handleKeyDown = (event: KeyboardEvent) => {
    // CTRL+B 快捷键切换底部面板显示状态
    if (event.ctrlKey && event.key === 'b') {
      event.preventDefault();
      toggleBottomPanel();
    }
    
    // Del键删除选中的组件
    if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElement.value) {
      event.preventDefault();
      deleteElement();
    }
  };
  
  // 开始框选
  const startMultiSelect = (event: MouseEvent) => {
    // 只在设计区域且没有选中其他元素时允许框选
    if (event.target === document.querySelector('.paper') || 
        (event.target as HTMLElement).closest('.band-content')) {
      event.preventDefault();
      isMultiSelecting.value = true;
      
      const paper = document.querySelector('.paper') as HTMLElement;
      const rect = paper.getBoundingClientRect();
      
      selectionBox.value = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        width: 0,
        height: 0
      };
      
      // 清空之前的多选结果
      selectedElements.value = [];
    }
  };
  
  // 更新框选区域
  const updateMultiSelect = (event: MouseEvent) => {
    if (isMultiSelecting.value) {
      const paper = document.querySelector('.paper') as HTMLElement;
      const rect = paper.getBoundingClientRect();
      
      const startX = selectionBox.value.x;
      const startY = selectionBox.value.y;
      const currentX = event.clientX - rect.left;
      const currentY = event.clientY - rect.top;
      
      selectionBox.value = {
        x: Math.min(startX, currentX),
        y: Math.min(startY, currentY),
        width: Math.abs(currentX - startX),
        height: Math.abs(currentY - startY)
      };
      
      // 检查哪些元素在框选范围内
      selectedElements.value = [];
      
      bands.value.forEach((band, bandIndex) => {
        let bandY = 0;
        for (let i = 0; i < bandIndex; i++) {
          bandY += bands.value[i].height;
        }
        
        band.elements.forEach((element, elementIndex) => {
          const elementTop = bandY + element.y;
          const elementLeft = element.x;
          const elementRight = elementLeft + element.width;
          const elementBottom = elementTop + element.height;
          
          const boxLeft = selectionBox.value.x;
          const boxTop = selectionBox.value.y;
          const boxRight = boxLeft + selectionBox.value.width;
          const boxBottom = boxTop + selectionBox.value.height;
          
          // 检查元素是否完全在框选范围内
          if (elementLeft >= boxLeft && elementTop >= boxTop && 
              elementRight <= boxRight && elementBottom <= boxBottom) {
            selectedElements.value.push({ bandIndex, elementIndex });
          }
        });
      });
    }
  };
  
  // 结束框选
  const endMultiSelect = () => {
    if (isMultiSelecting.value) {
      isMultiSelecting.value = false;
      selectionBox.value = { x: 0, y: 0, width: 0, height: 0 };
      
      // 如果有选中的元素，将第一个设为当前选中元素
      if (selectedElements.value.length > 0) {
        selectedElement.value = selectedElements.value[0];
        selectedBandIndex.value = null;
      }
    }
  };
  
  // 添加框选相关事件监听
  const paper = document.querySelector('.paper') as HTMLElement;
  if (paper) {
    paper.addEventListener('mousedown', startMultiSelect);
  }
  
  document.addEventListener('mousemove', updateMultiSelect);
  document.addEventListener('mouseup', endMultiSelect);
  document.addEventListener('keydown', handleKeyDown);
  
  // 保存监听器引用，以便在组件卸载时移除
  (window as any).pdfDesignerKeydownListener = handleKeyDown;
  (window as any).pdfDesignerMouseDownListener = startMultiSelect;
  (window as any).pdfDesignerMouseMoveListener = updateMultiSelect;
  (window as any).pdfDesignerMouseUpListener = endMultiSelect;
});

// 组件卸载时清理事件监听器
onUnmounted(() => {
  // 移除键盘事件监听器
  const handleKeyDown = (window as any).pdfDesignerKeydownListener;
  if (handleKeyDown) {
    document.removeEventListener('keydown', handleKeyDown);
  }
  
  // 移除框选相关事件监听器
  const startMultiSelect = (window as any).pdfDesignerMouseDownListener;
  const updateMultiSelect = (window as any).pdfDesignerMouseMoveListener;
  const endMultiSelect = (window as any).pdfDesignerMouseUpListener;
  
  const paper = document.querySelector('.paper') as HTMLElement;
  if (paper && startMultiSelect) {
    paper.removeEventListener('mousedown', startMultiSelect);
  }
  
  if (updateMultiSelect) {
    document.removeEventListener('mousemove', updateMultiSelect);
  }
  
  if (endMultiSelect) {
    document.removeEventListener('mouseup', endMultiSelect);
  }
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
const copyJRXML = async (): Promise<void> => {
  try {
    await navigator.clipboard.writeText(jrxmlContent.value);
    alert('JRXML内容已复制到剪贴板');
  } catch (err: unknown) {
    console.error('复制失败:', err);
    alert('复制失败，请手动复制');
  }
};

// 重新生成JRXML内容
const regenerateJRXML = (): void => {
  updateJRXML();
  // 显示提示信息
  alert('JRXML已重新生成');
};

// 保存编辑后的JRXML内容
const saveJRXML = (): void => {
  try {
    // 使用我们的parseJRXMLContent函数解析JRXML内容
    const parsedData = parseJRXMLContent(jrxmlContent.value);
    
    // 更新报表属性
    reportProperties.value = {
      ...parsedData.properties,
      defaultFont: reportProperties.value.defaultFont // 保留默认字体设置
    };
    
    // 更新字段定义
    reportFields.value = parsedData.fields;
    
    // 更新bands
    bands.value = parsedData.bands;
    
    // 为矩形元素添加默认边框，确保显示效果
    bands.value.forEach(band => {
      band.elements.forEach(element => {
        if (element.type === 'rectangle' && !element.border && (!element.box?.border && !element.box?.topBorderStyle)) {
          if (!element.box) {
            element.box = {};
          }
          element.box.border = 'Thin';
          element.box.borderColor = '#000000';
        }
        
        // 确保所有元素大小合理
        if (element.width < 20) element.width = 20; // 确保最小宽度
        if (element.height < 10) element.height = 10; // 确保最小高度
        
        // 对于box元素，确保解析的边框属性正确应用
        if (element.box) {
          // 处理pen元素中的边框样式
          const processPen = (pen: any): string => {
            if (!pen) return '';
            
            let width = '1px';
            let style = 'solid';
            let color = '#000000';
            
            if (pen.lineWidth) {
              width = `${pen.lineWidth}px`;
            }
            
            if (pen.lineStyle) {
              switch (pen.lineStyle) {
                case 'Dashed':
                  style = 'dashed';
                  break;
                case 'Dotted':
                  style = 'dotted';
                  break;
                case 'Double':
                  style = 'double';
                  break;
                default:
                  style = 'solid';
              }
            }
            
            if (pen.lineColor) {
              color = pen.lineColor;
            }
            
            return `${width} ${style} ${color}`;
          };
          
          // 为各边的pen设置边框样式
          if (element.box.topPen && !element.box.topBorderStyle) {
            element.box.topBorderStyle = processPen(element.box.topPen);
          }
          if (element.box.leftPen && !element.box.leftBorderStyle) {
            element.box.leftBorderStyle = processPen(element.box.leftPen);
          }
          if (element.box.bottomPen && !element.box.bottomBorderStyle) {
            element.box.bottomBorderStyle = processPen(element.box.bottomPen);
          }
          if (element.box.rightPen && !element.box.rightBorderStyle) {
            element.box.rightBorderStyle = processPen(element.box.rightPen);
          }
          
          // 处理border属性映射
          const borderMap: Record<string, string> = {
            'Thin': '1px',
            '1Point': '1px',
            '2Point': '2px',
            '4Point': '4px',
            'Dotted': '1px dotted',
            'Dashed': '1px dashed',
            'Double': '3px double'
          };
          
          // 应用边框属性
          const applyBorder = (borderAttr: string, colorAttr: string): string => {
            if (!borderAttr) return '';
            
            let borderValue = borderMap[borderAttr] || '1px';
            let borderColor = element.box?.[colorAttr] || '#000000';
            
            // 如果borderAttr是样式名称（非像素值），添加完整的边框样式
            if (borderAttr !== 'Thin' && borderAttr !== '1Point' && borderAttr !== '2Point' && borderAttr !== '4Point') {
              if (borderValue.includes(' ')) {
                return borderValue + ' ' + borderColor;
              }
              return `${borderValue} solid ${borderColor}`;
            }
            
            return `${borderValue} solid ${borderColor}`;
          };
          
          // 设置各边的边框样式
          if (element.box.topBorder && !element.box.topBorderStyle) {
            element.box.topBorderStyle = applyBorder(element.box.topBorder, 'topBorderColor');
          }
          if (element.box.leftBorder && !element.box.leftBorderStyle) {
            element.box.leftBorderStyle = applyBorder(element.box.leftBorder, 'leftBorderColor');
          }
          if (element.box.bottomBorder && !element.box.bottomBorderStyle) {
            element.box.bottomBorderStyle = applyBorder(element.box.bottomBorder, 'bottomBorderColor');
          }
          if (element.box.rightBorder && !element.box.rightBorderStyle) {
            element.box.rightBorderStyle = applyBorder(element.box.rightBorder, 'rightBorderColor');
          }
          
          // 如果设置了全局border属性，应用到所有边
          if (element.box.border && (!element.box.topBorderStyle || !element.box.leftBorderStyle || !element.box.bottomBorderStyle || !element.box.rightBorderStyle)) {
            const globalBorder = applyBorder(element.box.border, 'borderColor');
            if (!element.box.topBorderStyle) element.box.topBorderStyle = globalBorder;
            if (!element.box.leftBorderStyle) element.box.leftBorderStyle = globalBorder;
            if (!element.box.bottomBorderStyle) element.box.bottomBorderStyle = globalBorder;
            if (!element.box.rightBorderStyle) element.box.rightBorderStyle = globalBorder;
          }
        }
        
        // 确保元素不超出纸张边界
        element.x = Math.max(0, element.x);
        element.y = Math.max(0, element.y);
        if (element.x + element.width > paperWidth.value) {
          element.width = paperWidth.value - element.x;
        }
      });
      
      // 重新计算band所需最小高度
      let requiredHeight = 0;
      band.elements.forEach(element => {
        const elementBottom = element.y + element.height;
        requiredHeight = Math.max(requiredHeight, elementBottom);
      });
      
      // 确保band高度足够
      const additionalMargin = band.type === 'detail' ? 10 : 5;
      band.height = Math.max(requiredHeight + additionalMargin, band.height, 20);
    });
    
    // 保存到本地存储
    saveToLocalStorage();
    
    // 显示成功提示
    alert('JRXML编辑已保存，界面已更新');
  } catch (error: unknown) {
    console.error('保存JRXML失败:', error);
    alert(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};



// 开始调整band高度
const startResizingBand = (event: MouseEvent, bandIndex: number): void => {
  event.preventDefault();
  
  // 自动隐藏底部面板
  showBottomPanel.value = false;
  
  const startY = event.clientY;
  const startHeight = bands.value[bandIndex].height;
  
  const handleMouseMove = (e: MouseEvent): void => {
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
  
  const handleMouseUp = (): void => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

// 开始调整元素大小
const startResizingElement = (event: MouseEvent, bandIndex: number, elementIndex: number): void => {
  event.preventDefault();
  
  // 自动隐藏底部面板
  showBottomPanel.value = false;
  
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

// 组件卸载时清理事件监听器
onUnmounted(() => {
  if ((window as any).pdfDesignerKeydownListener) {
    document.removeEventListener('keydown', (window as any).pdfDesignerKeydownListener);
    delete (window as any).pdfDesignerKeydownListener;
  }
});

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
  position: relative;
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
  overflow-x: auto;
  display: flex;
  justify-content: flex-start;
}

/* 底部面板的过渡样式 */
.tabs-container {
  transition: height 0.3s ease;
  overflow: hidden;
  border-top: 1px solid #ddd;
  background-color: #f5f5f5;
  position: relative;
  min-height: 0; /* 允许底部面板高度调整时不会影响整体布局 */
}

/* 底部面板调整手柄 */
.tabs-resize-handle {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  cursor: ns-resize;
  background-color: transparent;
  z-index: 10;
}

.tabs-resize-handle:hover {
  background-color: rgba(25, 118, 210, 0.1);
}

.tabs-resize-handle::before {
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

.tabs-resize-handle:hover::before {
  opacity: 1;
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
  padding: 1rem;
  background-color: #f0f0f0;
  overflow: auto;
  min-height: 0; /* 允许flex子元素缩小 */
  position: relative;
}

/* 水平标尺样式 */
.horizontal-ruler {
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  height: 20px;
  background-color: #fff;
  border-bottom: 1px solid #ddd;
  margin-bottom: 10px;
  display: flex;
  align-items: flex-end;
  padding-bottom: 5px;
  z-index: 10;
}

.ruler-tick {
  position: absolute;
  width: 1px;
  height: 5px;
  background-color: #333;
}

.ruler-label {
  position: absolute;
  font-size: 10px;
  color: #666;
  text-align: center;
  transform: translateX(-50%);
  bottom: 2px;
}

.paper {
  background-color: #fff;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
  position: relative;
  overflow: visible;
  border-radius: 2px;
  transition: box-shadow 0.3s ease;
}

.paper:hover {
  box-shadow: 0 6px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.08);
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
  
  /* 高度输入框样式 */
  .band-height-input {
    width: 60px;
    padding: 2px 6px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
    text-align: center;
  }
  
  .unit-label {
    margin-left: 5px;
    font-size: 12px;
    color: #666;
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

.page-settings-tab {
  background-color: white;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
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

.jrxml-tab {
  background-color: white;
}

.jrxml-container {
  background-color: #f5f5f5;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.jrxml-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #e9e9e9;
  border-bottom: 1px solid #ddd;
  flex-shrink: 0;
}

.jrxml-content {
  flex: 1;
  overflow: auto;
  min-height: 0;
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

.jrxml-editor {
  width: 100%;
  height: 100%;
  padding: 15px;
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  border: none;
  outline: none;
  resize: none;
  tab-size: 2;
  overflow-wrap: break-word;
}

.jrxml-editor:focus {
  border: none;
  outline: none;
}

.jrxml-actions {
  display: flex;
  gap: 8px;
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

/* 元素标签页样式 */
.element-tabs {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.element-tab-navigation {
  display: flex;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.element-tab-button {
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
}

.element-tab-button:hover {
  background-color: #e9e9e9;
  color: #333;
}

.element-tab-button.active {
  background-color: #fff;
  color: #1890ff;
  border-bottom: 2px solid #1890ff;
}

.element-tab-content {
  padding: 16px;
  min-height: 200px;
}

/* 左侧数据字段区域样式 */
.data-fields-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.data-fields-section h4 {
  font-size: 14px;
  margin-bottom: 10px;
  color: #666;
}

.fields-mini-view {
  max-height: 200px;
  overflow-y: auto;
  font-size: 12px;
}

.field-mini-item {
  padding: 4px 8px;
  margin-bottom: 4px;
  background-color: #f5f5f5;
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-name {
  color: #1890ff;
  font-weight: 500;
}

.field-type {
  color: #666;
  font-size: 11px;
}

/* Box设置相关样式 */
.box-section {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.box-section:last-child {
  border-bottom: none;
}

.box-section h5 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.border-side-group {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
}

.side-label {
  min-width: 40px;
  font-size: 14px;
}

.side-control {
  flex: 1;
  max-width: 200px;
}

.color-control {
  width: 50px;
  height: 32px;
  padding: 2px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.init-box-section {
  padding: 20px;
  text-align: center;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.padding-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

/* 按钮样式 */
.btn-small {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #666;
  border: 1px solid #d9d9d9;
}

.btn-secondary:hover {
  background-color: #e6e6e6;
  color: #333;
}

.btn-primary {
  background-color: #1890ff;
  color: white;
  border: 1px solid #1890ff;
}

.btn-primary:hover {
  background-color: #40a9ff;
  border-color: #40a9ff;
}

.btn-danger {
  background-color: #ff4d4f;
  color: white;
  border: 1px solid #ff4d4f;
}

.btn-danger:hover {
  background-color: #ff7875;
  border-color: #ff7875;
}

.element-actions {
  margin-top: 16px;
  text-align: right;
}

/* JRXML内容区域高度最大化 */
.jrxml-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.jrxml-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.jrxml-header {
  padding: 10px 16px;
  border-bottom: 1px solid #eee;
}

.jrxml-content {
  flex: 1;
  overflow: hidden;
  display: flex;
}

.jrxml-editor {
  width: 100%;
  height: 100%;
  border: none;
  resize: none;
  padding: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  background-color: #f5f5f5;
  overflow: auto;
  box-sizing: border-box;
}

.jrxml-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
  background-color: #fafafa;
}

/* 框选样式 */
.selection-box {
  position: absolute;
  background-color: rgba(24, 144, 255, 0.2);
  border: 1px solid #1890ff;
  pointer-events: none;
  z-index: 1000;
}

/* 选中元素高亮样式 */
.design-element.selected {
  box-shadow: 0 0 0 2px #1890ff;
}
</style>