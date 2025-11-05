<template>
  <div class="pdf-designer">
    <div class="designer-header">
      <h1>PDF模板设计器</h1>
      <div class="header-actions">
        <!-- 文件管理菜单 -->
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
        <span class="current-file-name">{{ currentFileName }}</span>
        
        <button @click="toggleLeftPanel" class="btn-secondary">
          {{ showLeftPanel ? '隐藏左侧面板' : '显示左侧面板' }}
        </button>
        <button @click="toggleRightPanel" class="btn-secondary">
          {{ showRightPanel ? '隐藏右侧面板' : '显示右侧面板' }}
        </button>
        <button @click="toggleBottomPanel" class="btn-secondary">
          {{ showBottomPanel ? '隐藏底部面板' : '显示底部面板' }}
        </button>
        
        <!-- 自动吸附开关 -->
        <div class="snap-toggle">
          <label>
            <input type="checkbox" v-model="enableSnapToGrid" />
            网格吸附
          </label>
          <label>
            <input type="checkbox" v-model="enableSnapToAlignment" />
            对齐线吸附
          </label>
        </div>
        
        <!-- 缩放控制 -->
        <div class="zoom-controls">
          <button @click="zoomOut" class="btn-zoom" title="缩小">-</button>
          <select v-model="zoomLevel" @change="applyZoom" class="zoom-select">
            <option v-for="level in ZOOM_CONSTANTS.ZOOM_LEVELS" :key="level" :value="level">{{ level * 100 }}%</option>
          </select>
          <button @click="zoomIn" class="btn-zoom" title="放大">+</button>
          <button @click="resetZoom" class="btn-zoom" title="重置缩放">{{ ZOOM_CONSTANTS.DEFAULT_ZOOM * 100 }}%</button>
          <button @click="calculateOptimalZoom" class="btn-zoom" title="适应窗口">⊡</button>
        </div>
        
        <button @click="clearLocalStorage" class="btn-secondary">清空本地数据</button>
        <button @click="generateJRXML" class="btn-primary">生成JRXML</button>
        <button @click="showRewardModal" class="btn-secondary">打赏</button>
        <button @click="showHelpModal" class="btn-secondary">使用说明</button>
      </div>
    </div>
    
    <!-- 坐标显示元素 -->
      <div 
        v-if="dragCoordinates.visible" 
        class="coordinates-display"
      >
        {{ dragCoordinates.bandName }}X: {{ dragCoordinates.x }}, Y: {{ dragCoordinates.y }} (相对于Band)
      </div>
      
      <div class="designer-layout">
      <!-- 左侧元素库 -->
      <ResizablePanel 
        v-show="showLeftPanel"
        position="left"
        :initial-size="leftPanelWidth"
        :min-size="PANEL_CONSTANTS.LEFT_PANEL_MIN_WIDTH"
        :max-size="PANEL_CONSTANTS.LEFT_PANEL_MAX_WIDTH"
        :collapsible="false"
        @size-change="handleLeftPanelSizeChange"
      >
        <div class="left-panel-content">
          <h3>元素库</h3>
          <div class="element-list">
            <div 
              v-for="element in elements" 
              :key="element.type"
              class="element-item"
              @dragstart="handleDragStart($event, element)"
              draggable="true"
            >
              <span class="element-icon">{{ getElementIcon(element.type) }}</span>
              <span class="element-name">{{ element.name }}</span>
            </div>
          </div>
          
          <!-- 报表元素区域 -->
          <div class="report-elements-section">
            <h4>报表元素</h4>
            <div class="filter-input-container">
              <input 
                v-model="elementFilterText" 
                type="text" 
                placeholder="过滤元素..." 
                class="filter-input"
              />
              <button 
                v-if="elementFilterText" 
                @click="elementFilterText = ''" 
                class="clear-filter-btn"
                title="清除过滤"
              >
                ✕
              </button>
            </div>
            <div class="report-elements-list">
              <div v-for="(elements, bandName) in groupedReportElements" :key="bandName" class="band-group">
                <div class="band-group-header">{{ bandName }}</div>
                <div 
                  v-for="element in elements" 
                  :key="getElementKey(element)"
                  class="report-element-item"
                  :class="{ 'selected': isElementSelected(element,selectedElement) }"
                  @click="selectElementFromList(element, selectElement)"
                >
                  <span class="element-icon">{{ getElementIcon(element.element.type) }}</span>
                  <span class="element-info">{{ getElementDisplayInfoWithoutBand(element.element) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 报表参数区域 -->
          <div class="data-parameters-section">
            <h4>报表参数</h4>
            <div class="parameters-mini-view">
              <div 
                v-for="(param, index) in reportParameters" 
                :key="index" 
                class="field-mini-item"
                @click="selectElementsByParameterWrapper(param.name)"
              >
                <span class="field-name">$P{ {{ param.name }} }</span>
                <span class="field-type">({{ param.class }})</span>
              </div>
            </div>
          </div>
          
          <!-- 数据字段区域 -->
          <div class="data-fields-section">
            <h4>数据字段</h4>
            <div class="fields-mini-view">
              <div 
                v-for="(field, index) in reportFields" 
                :key="index" 
                class="field-mini-item"
                @click="selectElementsByFieldWrapper(field.name)"
              >
                <span class="field-name">$F{ {{ field.name }} }</span>
                <span class="field-type">({{ field.class }})</span>
              </div>
            </div>
          </div>
        </div>
      </ResizablePanel>
      
      <!-- 中间设计区域 -->
      <DesignerCanvas
        ref="designerCanvasRef"
        :paper-width="paperWidth"
        :paper-height="paperHeight"
        :zoom-level="zoomLevel"
        :report-properties="reportProperties"
        :bands="bands"
        :selected-band-index="selectedBandIndex"
        :highlighted-band-index="highlightedBandIndex"
        :selected-element="selectedElement"
        :editing-element="editingElement"
        :is-dragging-or-resizing="isDraggingOrResizing"
        :alignment-lines="alignmentLines"
        :horizontal-ruler-ticks="horizontalRulerTicks"
        :horizontal-ruler-labels="horizontalRulerLabels"
        :vertical-ruler-ticks="verticalRulerTicks"
        :vertical-ruler-labels="verticalRulerLabels"
        :is-design-area-focused="isDesignAreaFocused"
        :out-of-bounds-elements="outOfBoundsElements"
        :ui-constants="UI_CONSTANTS"
        @set-design-area-focused="setDesignAreaFocused"
        @select-band="selectBand"
        @select-element="selectElement"
        @start-dragging="startDragging"
        @start-resizing-element="startResizingElement"
        @start-editing="startEditing"
        @finish-editing="finishEditing"
        @cancel-editing="cancelEditing"
        @handle-drop="handleDrop"
        @handle-drag-over="handleDragOver"
        @handle-drag-leave="handleDragLeave"
        @start-resizing-band="startResizingBand"
        @zoom-change="handleZoomChange"
      />
      
      <!-- 右侧属性面板 -->
      <ResizablePanel 
        v-show="showRightPanel"
        position="right"
        :initial-size="propertyPanelWidth"
        :min-size="200"
        :max-size="600"
        :collapsible="false"
        @size-change="handlePropertyPanelSizeChange"
      >
        <h3>属性设置</h3>
        
        <!-- 报表属性 -->
        <div v-if="!selectedBandIndex && !selectedElement" class="property-section">
          <h4>报表属性</h4>
          
          <!-- Band高度设置 -->
          <div class="form-group">
            <h4>Band高度设置</h4>
            <div class="band-heights-grid">
              <div v-for="(band, index) in bands" :key="index" class="band-height-item">
                <label>{{ getBandDisplayName(band.type) }}</label>
                <div class="band-height-control">
                  <input 
                    v-model.number="band.height" 
                    type="number" 
                    min="0"
                    class="band-height-input"
                    @change="updateBandHeight(index)"
                    @blur="updateBandHeight(index)"
                  />
                  <span class="band-height-unit">px</span>
                </div>
              </div>
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
                <input v-if="currentElement" v-model.number="currentElement.x" type="number" />
              </div>
              <div class="form-group">
                <label>Y坐标 (相对于当前Band)</label>
                <input v-if="currentElement" v-model.number="currentElement.y" type="number" />
              </div>
              <div class="form-group">
                <label>宽度</label>
                <input v-if="currentElement" v-model.number="currentElement.width" type="number" />
              </div>
              <div class="form-group">
                <label>高度</label>
                <input v-if="currentElement" v-model.number="currentElement.height" type="number" />
              </div>
              
              <!-- 根据元素类型显示特定属性 -->
              <template v-if="currentElement && currentElement.type === 'staticText'">
                <div class="form-group">
                  <label>文本内容</label>
                  <textarea v-if="currentElement" v-model="currentElement.text"></textarea>
                </div>
                <div class="form-group">
                  <label>字体大小</label>
                  <input v-if="currentElement" v-model.number="currentElement.fontSize" type="number" />
                </div>
                <div class="form-group">
                  <label>是否粗体</label>
                  <input v-if="currentElement" v-model="currentElement.isBold" type="checkbox" />
                </div>
              </template>
              
              <template v-else-if="currentElement && currentElement.type === 'textField'">
                <div class="form-group">
                  <label>字段名称</label>
                  <input v-if="currentElement" v-model="currentElement.fieldName" type="text" @input="updateExpressionFromFieldName" />
                </div>
                <div class="form-group" v-if="currentElement && currentElement.type === 'textField'">
                  <label>表达式</label>
                  <input v-if="currentElement" v-model="(currentElement as any).expression" type="text" />
                  <small>例如: $F{字段名} 或 $F{字段名}.toString()</small>
                </div>
                <div class="form-group">
                  <label>格式模式</label>
                  <input v-if="currentElement" v-model="currentElement.pattern" type="text" />
                  <small>例如: 日期格式 "yyyy-MM-dd"，数字格式 "#,##0.00"</small>
                </div>
                <div class="form-group">
                  <label>文本对齐</label>
                  <select v-if="currentElement" v-model="currentElement.textAlignment">
                    <option value="Left">左对齐</option>
                    <option value="Center">居中</option>
                    <option value="Right">右对齐</option>
                    <option value="Justified">两端对齐</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>垂直对齐</label>
                  <select v-if="currentElement" v-model="currentElement.verticalAlignment">
                    <option value="Top">顶部</option>
                    <option value="Middle">中间</option>
                    <option value="Bottom">底部</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>字体大小</label>
                  <input v-if="currentElement" v-model.number="currentElement.fontSize" type="number" />
                </div>
                <div class="checkbox-group">
                  <label>
                    <input v-if="currentElement" v-model="currentElement.isBold" type="checkbox" />
                    粗体
                  </label>
                  <label>
                    <input v-if="currentElement" v-model="currentElement.isItalic" type="checkbox" />
                    斜体
                  </label>
                  <label>
                    <input v-if="currentElement" v-model="currentElement.isUnderline" type="checkbox" />
                    下划线
                  </label>
                </div>
                <div class="form-group">
                  <label>
                    <input v-if="currentElement" v-model="currentElement.isStretchWithOverflow" type="checkbox" />
                    内容超出时自动拉伸
                  </label>
                </div>
                <div class="form-group">
                  <label>
                    <input v-if="currentElement" v-model="currentElement.isBlankWhenNull" type="checkbox" />
                    值为null时显示空白
                  </label>
                </div>
                <div class="form-group">
                  <label>表达式计算时机</label>
                  <select v-if="currentElement" v-model="currentElement.evaluationTime">
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
            
            <!-- 边框设置标签页 -->
            <div class="element-tab-content" v-show="activeElementTab === 'box'">
              <h4>边框设置</h4>
              
              <!-- 全局边框设置 -->
              <div class="box-section">
                <h5>全局边框</h5>
                <div class="form-group">
                  <label>边框样式</label>
                  <select v-if="currentElement && currentElement.box" v-model="currentElement.box.border">
                    <option value="">无</option>
                    <option value="Thin">细线 ({{ BORDER_CONSTANTS.THIN_WIDTH }}px)</option>
                    <option value="Medium">中等 ({{ BORDER_CONSTANTS.MEDIUM_WIDTH }}px)</option>
                    <option value="Thick">粗线 ({{ BORDER_CONSTANTS.THICK_WIDTH }}px)</option>
                    <option value="Dashed">虚线</option>
                    <option value="Dotted">点线</option>
                    <option value="Double">双线</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>边框颜色</label>
                  <input v-if="currentElement && currentElement.box" v-model="currentElement.box.borderColor" type="color" />
                </div>
              </div>
              
              <!-- 各边边框设置 -->
              <div class="box-section">
                <h5>各边边框（覆盖全局设置）</h5>
                
                <!-- 上边 -->
                <div class="border-side-group">
                  <label class="side-label">上边</label>
                  <select v-if="currentElement && currentElement.box" v-model="currentElement.box.topBorder" class="side-control">
                    <option value="">使用全局</option>
                    <option value="Thin">细线 ({{ BORDER_CONSTANTS.THIN_WIDTH }}px)</option>
                    <option value="Medium">中等 ({{ BORDER_CONSTANTS.MEDIUM_WIDTH }}px)</option>
                    <option value="Thick">粗线 ({{ BORDER_CONSTANTS.THICK_WIDTH }}px)</option>
                    <option value="Dashed">虚线</option>
                    <option value="Dotted">点线</option>
                    <option value="Double">双线</option>
                  </select>
                  <input v-if="currentElement && currentElement.box" v-model="currentElement.box.topBorderColor" type="color" class="color-control" />
                </div>
                
                <!-- 左边 -->
                <div class="border-side-group">
                  <label class="side-label">左边</label>
                  <select v-if="currentElement && currentElement.box" v-model="currentElement.box.leftBorder" class="side-control">
                    <option value="">使用全局</option>
                    <option value="Thin">细线 ({{ BORDER_CONSTANTS.THIN_WIDTH }}px)</option>
                    <option value="Medium">中等 ({{ BORDER_CONSTANTS.MEDIUM_WIDTH }}px)</option>
                    <option value="Thick">粗线 ({{ BORDER_CONSTANTS.THICK_WIDTH }}px)</option>
                    <option value="Dashed">虚线</option>
                    <option value="Dotted">点线</option>
                    <option value="Double">双线</option>
                  </select>
                  <input v-if="currentElement && currentElement.box" v-model="currentElement.box.leftBorderColor" type="color" class="color-control" />
                </div>
                
                <!-- 下边 -->
                <div class="border-side-group">
                  <label class="side-label">下边</label>
                  <select v-if="currentElement && currentElement.box" v-model="currentElement.box.bottomBorder" class="side-control">
                    <option value="">使用全局</option>
                    <option value="Thin">细线 ({{ BORDER_CONSTANTS.THIN_WIDTH }}px)</option>
                    <option value="Medium">中等 ({{ BORDER_CONSTANTS.MEDIUM_WIDTH }}px)</option>
                    <option value="Thick">粗线 ({{ BORDER_CONSTANTS.THICK_WIDTH }}px)</option>
                    <option value="Dashed">虚线</option>
                    <option value="Dotted">点线</option>
                    <option value="Double">双线</option>
                  </select>
                  <input v-if="currentElement && currentElement.box" v-model="currentElement.box.bottomBorderColor" type="color" class="color-control" />
                </div>
                
                <!-- 右边 -->
                <div class="border-side-group">
                  <label class="side-label">右边</label>
                  <select v-if="currentElement && currentElement.box" v-model="currentElement.box.rightBorder" class="side-control">
                    <option value="">使用全局</option>
                    <option value="Thin">细线 ({{ BORDER_CONSTANTS.THIN_WIDTH }}px)</option>
                    <option value="Medium">中等 ({{ BORDER_CONSTANTS.MEDIUM_WIDTH }}px)</option>
                    <option value="Thick">粗线 ({{ BORDER_CONSTANTS.THICK_WIDTH }}px)</option>
                    <option value="Dashed">虚线</option>
                    <option value="Dotted">点线</option>
                    <option value="Double">双线</option>
                  </select>
                  <input v-if="currentElement && currentElement.box" v-model="currentElement.box.rightBorderColor" type="color" class="color-control" />
                </div>
              </div>
              
              <!-- 边距设置 -->
              <div class="box-section">
                <h5>边距设置</h5>
                <div class="form-group">
                  <label>全局边距（像素）</label>
                  <input v-if="currentElement && currentElement.box" v-model.number="currentElement.box.padding" type="number" placeholder="全部边距" />
                  <small>设置后会覆盖各边独立设置</small>
                </div>
                
                <div class="padding-grid">
                  <div class="form-group">
                    <label>上边距</label>
                    <input v-if="currentElement && currentElement.box" v-model.number="currentElement.box.topPadding" type="number" />
                  </div>
                  <div class="form-group">
                    <label>左边距</label>
                    <input v-if="currentElement && currentElement.box" v-model.number="currentElement.box.leftPadding" type="number" />
                  </div>
                  <div class="form-group">
                    <label>下边距</label>
                    <input v-if="currentElement && currentElement.box" v-model.number="currentElement.box.bottomPadding" type="number" />
                  </div>
                  <div class="form-group">
                    <label>右边距</label>
                    <input v-if="currentElement && currentElement.box" v-model.number="currentElement.box.rightPadding" type="number" />
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 样式设置标签页 -->
            <div class="element-tab-content" v-show="activeElementTab === 'style'">
              <h4>样式设置</h4>
              <div class="form-group">
                <label>背景颜色</label>
                <input v-if="currentElement" v-model="currentElement.backcolor" type="color" />
              </div>
              
              <template v-if="currentElement && currentElement.type !== 'line' && currentElement.type !== 'image'">
                <div class="form-group">
                  <label>字体名称</label>
                  <select v-if="currentElement" v-model="currentElement.fontFamily" style="appearance: none; -webkit-appearance: none;">
                    <option value="">使用默认字体</option>
                    <option value="SansSerif">SansSerif</option>
                    <option value="Serif">Serif</option>
                    <option value="Monospaced">Monospaced</option>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Noto Serif SC">Noto Serif SC</option>
                  </select>
                  <small class="font-hint">提示：可以直接在下拉框中输入字体名称</small>
                </div>
                
                <div class="form-group">
                  <label>文本对齐</label>
                  <div class="alignment-controls">
                    <button 
                      v-for="align in ['Left', 'Center', 'Right']" 
                      :key="align"
                      @click="setHorizontalAlignment(align as 'Left' | 'Center' | 'Right')"
                      :class="{ active: currentElement && currentElement.textAlignment === align }"
                      class="align-button"
                      title="水平对齐: {{ align }}"
                    >
                      {{ align === 'Left' ? '左对齐' : align === 'Center' ? '居中对齐' : '右对齐' }}
                    </button>
                  </div>
                </div>
                
                <div class="form-group">
                  <label>垂直对齐</label>
                  <div class="alignment-controls">
                    <button 
                      v-for="align in ['Top', 'Middle', 'Bottom']" 
                      :key="align"
                      @click="setVerticalAlignment(align as 'Top' | 'Middle' | 'Bottom')"
                      :class="{ active: currentElement && currentElement.verticalAlignment === align }"
                      class="align-button"
                      title="垂直对齐: {{ align }}"
                    >
                      {{ align === 'Top' ? '顶部对齐' : align === 'Middle' ? '垂直居中' : '底部对齐' }}
                    </button>
                  </div>
                </div>
                
                <div class="checkbox-group">
                  <label>
                    <input v-if="currentElement" v-model="currentElement.isBold" type="checkbox" />
                    粗体
                  </label>
                  <label>
                    <input v-if="currentElement" v-model="currentElement.isItalic" type="checkbox" />
                    斜体
                  </label>
                  <label>
                    <input v-if="currentElement" v-model="currentElement.isUnderline" type="checkbox" />
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
      </ResizablePanel>
    </div>
    
    <!-- 底部标签页区域 -->
    <ResizablePanel 
      v-show="showBottomPanel"
      position="bottom"
      :initial-size="bottomPanelHeight"
      :min-size="150"
      :max-size="400"
      :collapsible="true"
      @size-change="handleBottomPanelSizeChange"
    >
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
      </div>
      
      <!-- 页面设置标签 -->
      <div class="tab-content page-settings-tab" v-show="activeTab === 'pageSettings'">
        <div class="settings-grid">
          <div class="settings-section">
            <h4>基本信息</h4>
            <div class="form-group">
              <label>报表名称</label>
              <input v-model="reportProperties.name" type="text" />
            </div>
            <div class="form-row">
              <div class="form-group flex-1">
                <label>页面宽度</label>
                <input v-model.number="reportProperties.pageWidth" type="number" />
              </div>
              <div class="form-group flex-1">
                <label>页面高度</label>
                <input v-model.number="reportProperties.pageHeight" type="number" />
              </div>
            </div>
          </div>
          
          <div class="settings-section">
            <h4>页边距设置</h4>
            <div class="form-group">
              <label>页边距 (px)</label>
              <div class="margin-inputs">
                <input v-model.number="reportProperties.leftMargin" type="number" placeholder="左" />
                <input v-model.number="reportProperties.rightMargin" type="number" placeholder="右" />
                <input v-model.number="reportProperties.topMargin" type="number" placeholder="上" />
                <input v-model.number="reportProperties.bottomMargin" type="number" placeholder="下" />
              </div>
            </div>
          </div>

          <!-- 字体设置 - 紧凑布局 -->
          <div class="settings-section font-settings-compact">
            <h4>默认字体设置</h4>
            <div class="font-settings-row">
              <div class="font-setting-item">
                <label>字体名称</label>
                <select v-model="reportProperties.defaultFont.name">
                  <option value="SansSerif">SansSerif</option>
                  <option value="Serif">Serif</option>
                  <option value="Monospaced">Monospaced</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Noto Serif SC">Noto Serif SC</option>
                </select>
              </div>
              <div class="font-setting-item">
                <label>字体大小</label>
                <input v-model.number="reportProperties.defaultFont.size" type="number" />
              </div>
            </div>
            <div class="font-style-options">
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
          
          <!-- Band选择 -->
          <div class="settings-section band-selection-section">
            <h4>Band选择</h4>
            <div class="band-selection-grid">
              <div v-for="bandType in allBandTypes" :key="bandType.type" class="band-selection-item">
                <label>
                  <input 
                    type="checkbox" 
                    :value="bandType.type"
                    v-model="selectedBandTypes"
                    @change="handleBandSelectionChange"
                  />
                  {{ bandType.name }}
                </label>
              </div>
            </div>
            <div class="band-selection-note">
              <small>勾选的band将自动添加到报表中，取消勾选的band将从报表中移除</small>
            </div>
          </div>
        </div>
      </div>
      
      <!-- JRXML内容标签 -->
      <div class="tab-content jrxml-tab" v-show="activeTab === 'jrxml'">
        <div class="jrxml-container">
          <div class="jrxml-header">
            <div class="jrxml-actions">
              <button @click="copyJRXML" class="btn-secondary btn-small">复制</button>
              <button @click="saveJRXML" class="btn-primary btn-small">应用</button>
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
    </ResizablePanel>
    
    <!-- 打赏弹窗 -->
      <div v-if="showReward" class="reward-modal" @click.self="closeRewardModal">
        <div class="reward-content">
          <button class="close-btn" @click="closeRewardModal">×</button>
          <h3>感谢您的支持！</h3>
          <img src="/src/assets/FIREGOD_CN.jpg" alt="打赏码" class="reward-image">
          <p>扫码打赏，感谢支持！</p>
        </div>
      </div>
      
      <!-- 使用说明弹窗 -->
      <div v-if="showHelp" class="help-modal" @click.self="closeHelpModal">
        <div class="help-content">
          <button class="close-btn" @click="closeHelpModal">×</button>
          <h3>PDF模板设计器使用说明</h3>
          <div class="help-content-scroll">
            <h4>1. 模板设计基础</h4>
            <p>本工具用于可视化设计JasperReports的PDF报表模板，通过拖拽方式快速创建专业的PDF报表。</p>
            
            <h4>2. 操作步骤</h4>
            <ol>
              <li><strong>修改现有JRXML</strong>：打开底部面板，将现在的JRXML复制到代码区，然后点击应用</li>
              <li><strong>添加元素</strong>：从左侧元素库拖拽元素到设计区域</li>
              <li><strong>调整布局</strong>：拖动元素调整位置，拖拽右下角调整大小</li>
              <li><strong>设置属性</strong>：选中元素后，在右侧面板设置属性</li>
              <li><strong>配置数据</strong>：在左侧面板添加报表参数和数据字段</li>
              <li><strong>生成JRXML</strong>：点击"生成JRXML"按钮导出报表模板</li>
            </ol>
            
            <h4>3. 支持的元素类型</h4>
            <ul>
              <li>静态文本：显示固定文本内容</li>
              <li>文本字段：显示动态数据字段</li>
              <li>图片：插入图像元素</li>
              <li>线条：添加分隔线</li>
              <li>矩形：添加边框或背景块</li>
            </ul>
            
            <h4>4. 快捷键</h4>
            <ul>
              <li><strong>Ctrl+S</strong>：保存当前文件</li>
              <li><strong>Ctrl+B</strong>：切换底部JRXML面板显示</li>
              <li><strong>Ctrl+Z</strong>：撤销操作</li>
              <li><strong>Ctrl+Y</strong>：重做操作</li>
              <li><strong>Ctrl+C</strong>：复制选中元素</li>
              <li><strong>Ctrl+V</strong>：粘贴元素</li>
              <li><strong>Delete/Backspace</strong>：删除选中元素（非编辑模式）</li>
              <li><strong>方向键</strong>：选择周围元素</li>
            </ul>
            
            <h4>5. 注意事项</h4>
            <ul>
              <li>元素不能超出纸张边界</li>
              <li>编辑文本时按Enter确认，Esc取消</li>
              <li>拖动元素时不会实时更新JRXML，释放鼠标后才会更新</li>
              <li>所有修改会自动保存到本地存储</li>
            </ul>
          </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 定义文件接口类型
interface DesignerFile {
  id: string;
  name: string;
  content?: string;
  lastModified?: Date | string;
  createdAt?: Date | string;
}

import ResizablePanel from './ResizablePanel.vue';
import DesignerCanvas from './designer/DesignerCanvas.vue';
import type {Band, BandType, DesignElement, ReportField, ReportParameter} from '../types';
import {computed, onMounted, onUnmounted, ref, watch} from 'vue';
import {
  BAND_CONSTANTS,
  BAND_HEIGHT_CONSTANTS,
  BAND_TYPE_CONSTANTS,
  BORDER_CONSTANTS,
  DOM_CONSTANTS,
  ELEMENT_CONSTANTS,
  ELEMENT_TYPE_CONSTANTS,
  FONT_CONSTANTS,
  HISTORY_CONSTANTS,
  KEYBOARD_CONSTANTS,
  PANEL_CONSTANTS,
  REPORT_CONSTANTS,
  RULER_CONSTANTS,
  UI_CONSTANTS,
  ZOOM_CONSTANTS
} from '../constants/constants';

// 导入新创建的工具函数和常量
import {
  getElementDisplayInfoWithoutBand,
  getElementIcon,
  getElementKey,
  getElementTypeName,
  isElementSelected,
  selectElementFromList,
  selectElementsByField,
  selectElementsByParameter
} from '../utils/elementUtils';

import {getBandDisplayName} from '../utils/bandUtils';

import {clearLocalStorage, loadFromLocalStorage, saveToLocalStorage} from '../utils/fileUtils';

// 导入元素边界验证工具
import {
  getOutOfBoundsElements
} from '../utils/elementBoundsValidator';

// 确保浏览器环境中DOMParser可用
// 移除未使用的getDOMParser函数
import {generateJRXMLContent, parseJRXMLContent} from '../utils/jrxmlGenerator';

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
const showBottomPanel = ref(false);

// 属性面板宽度
const propertyPanelWidth = ref(PANEL_CONSTANTS.DEFAULT_PROPERTY_PANEL_WIDTH); // 默认宽度300px

// 左侧面板宽度
const leftPanelWidth = ref(PANEL_CONSTANTS.DEFAULT_LEFT_PANEL_WIDTH); 

// 自动吸附功能开关
const enableSnapToGrid = ref(false);
const enableSnapToAlignment = ref(true); // 默认开启对齐线吸附

// 对齐线相关状态
const alignmentLines = ref({
  horizontal: [] as number[],
  vertical: [] as number[]
});

// 缩放相关状态
const zoomLevel = ref(ZOOM_CONSTANTS.DEFAULT_ZOOM); // 默认缩放级别为100%

// DesignerCanvas组件引用
const designerCanvasRef = ref<any>(null);

// 缩放控制方法
function zoomIn() {
  // 预设的缩放级别
  const zoomLevels = ZOOM_CONSTANTS.ZOOM_LEVELS;
  
  // 找到当前缩放级别在预设级别中的索引
  const currentIndex = zoomLevels.findIndex(level => level === zoomLevel.value);
  
  // 如果当前缩放级别是预设值，则使用下一个预设值
  if (currentIndex !== -1 && currentIndex < zoomLevels.length - 1) {
    const nextLevel = zoomLevels[currentIndex + 1];
    if (nextLevel !== undefined) {
      zoomLevel.value = nextLevel;
    }
  } 
  // 如果当前缩放级别不是预设值，找到最接近的下一个预设值
  else {
    const nextLevel = zoomLevels.find(level => level > zoomLevel.value);
    if (nextLevel) {
      zoomLevel.value = nextLevel;
    }
  }
  
  applyZoom();
}

function zoomOut() {
  // 预设的缩放级别
  const zoomLevels = ZOOM_CONSTANTS.ZOOM_LEVELS;
  
  // 找到当前缩放级别在预设级别中的索引
  const currentIndex = zoomLevels.findIndex(level => level === zoomLevel.value);
  
  // 如果当前缩放级别是预设值，则使用上一个预设值
  if (currentIndex !== -1 && currentIndex > 0) {
    const prevLevel = zoomLevels[currentIndex - 1];
    if (prevLevel !== undefined) {
      zoomLevel.value = prevLevel;
    }
  } 
  // 如果当前缩放级别不是预设值，找到最接近的上一个预设值
  else {
    // 找到所有小于当前缩放级别的预设值
    const lowerLevels = zoomLevels.filter(level => level < zoomLevel.value);
    if (lowerLevels.length > 0) {
      const lastLevel = lowerLevels[lowerLevels.length - 1];
      if (lastLevel !== undefined) {
        zoomLevel.value = lastLevel;
      }
    }
  }
  
  applyZoom();
}

function resetZoom() {
  zoomLevel.value = ZOOM_CONSTANTS.DEFAULT_ZOOM;
  applyZoom();
}

function applyZoom() {
  // 这里不需要额外操作，因为zoomLevel是响应式的，会自动更新视图
}

// 处理来自DesignerCanvas的缩放变化
function handleZoomChange(delta: number) {
  // 计算新的缩放级别
  const newZoom = Math.max(ZOOM_CONSTANTS.MIN_ZOOM, Math.min(ZOOM_CONSTANTS.MAX_ZOOM, zoomLevel.value + delta));
  
  // 从预设的缩放级别中选择最接近的
  const zoomLevels = ZOOM_CONSTANTS.ZOOM_LEVELS;
  let closestZoom = zoomLevels[0] || ZOOM_CONSTANTS.DEFAULT_ZOOM;
  let minDiff = Math.abs((zoomLevels[0] || ZOOM_CONSTANTS.DEFAULT_ZOOM) - newZoom);
  
  for (let i = 1; i < zoomLevels.length; i++) {
    const level = zoomLevels[i];
    if (level !== undefined) {
      const diff = Math.abs(level - newZoom);
      if (diff < minDiff) {
        minDiff = diff;
        closestZoom = level;
      }
    }
  }
  
  // 设置新的缩放级别
  zoomLevel.value = closestZoom;
}

// 根据报表大小自动计算最佳缩放比例
function calculateOptimalZoom() {
  // 获取设计区域的可用大小 - 使用ref引用
  const designerContainer = designerCanvasRef.value?.$el;
  if (!designerContainer) return;
  
  // 获取设计区域的实际可用宽度
  const availableWidth = designerContainer.clientWidth - DOM_CONSTANTS.SCROLL_BAR_WIDTH; // 减去垂直标尺的宽度
  
  // 计算宽度的缩放比例
  const widthRatio = availableWidth / paperWidth.value;
  
  // 使用宽度缩放比例，确保报表宽度适应设计区域
  const optimalZoom = widthRatio * ZOOM_CONSTANTS.OPTIMAL_ZOOM_MARGIN; // 乘以0.9留出一些边距
  
  // 从预设的缩放级别中选择最接近的
  const zoomLevels = ZOOM_CONSTANTS.ZOOM_LEVELS;
  
  // 找到最接近optimalZoom的预设缩放级别
  let closestZoom = zoomLevels[0] || ZOOM_CONSTANTS.DEFAULT_ZOOM;
  let minDiff = Math.abs((zoomLevels[0] || ZOOM_CONSTANTS.DEFAULT_ZOOM) - optimalZoom);
  
  for (let i = 1; i < zoomLevels.length; i++) {
    const level = zoomLevels[i];
    if (level !== undefined) {
      const diff = Math.abs(level - optimalZoom);
      if (diff < minDiff) {
        minDiff = diff;
        closestZoom = level;
      }
    }
  }
  
  // 设置计算出的最佳缩放比例
  zoomLevel.value = closestZoom;
}

// 设置水平对齐方式
function setHorizontalAlignment(alignment: 'Left' | 'Center' | 'Right') {
  if (currentElement.value) {
    currentElement.value.textAlignment = alignment;
  }
}

// 设置垂直对齐方式
function setVerticalAlignment(alignment: 'Top' | 'Middle' | 'Bottom') {
  if (currentElement.value) {
    currentElement.value.verticalAlignment = alignment;
  }
}

// 当字段名称变化时，如果表达式为空则自动生成表达式
function updateExpressionFromFieldName() {
  if (currentElement.value && currentElement.value.type === 'textField') {
    const fieldName = currentElement.value.fieldName;
    // 只有当字段名称不为空且表达式为空时才自动生成
    if (fieldName && !currentElement.value.expression) {
      currentElement.value.expression = `$F{${fieldName}}`;
    }
  }
}
// 底部面板高度
const bottomPanelHeight = ref(PANEL_CONSTANTS.DEFAULT_BOTTOM_PANEL_HEIGHT); // 默认高度400px

// JRXML内容显示
const jrxmlContent = ref('');

// 报表属性
const reportProperties = ref({
  name: 'NewReport',
  pageWidth: REPORT_CONSTANTS.DEFAULT_PAGE_WIDTH,
  pageHeight: REPORT_CONSTANTS.DEFAULT_PAGE_HEIGHT,
  leftMargin: REPORT_CONSTANTS.DEFAULT_MARGIN,
  rightMargin: REPORT_CONSTANTS.DEFAULT_MARGIN,
  topMargin: REPORT_CONSTANTS.DEFAULT_MARGIN,
  bottomMargin: REPORT_CONSTANTS.DEFAULT_MARGIN,
  defaultFont: {
    name: FONT_CONSTANTS.SANS_SERIF,
    size: REPORT_CONSTANTS.DEFAULT_FONT_SIZE,
    isBold: false,
    isItalic: false,
    isUnderline: false
  },
  
});

// 文件管理相关状态
const showFileMenu = ref(false);
const showFileSubmenu = ref(false);
const currentFileName = ref('未命名报表');
const currentFileId = ref<string | null>(null);
const fileMenuContainer = ref<HTMLElement | null>(null);

// 文件列表相关
const files = ref<DesignerFile[]>([]);
const fileFilterText = ref('');

// 文件操作方法
function toggleFileMenu() {
  showFileMenu.value = !showFileMenu.value;
  // 关闭文件列表子菜单
  showFileSubmenu.value = false;
}

// 切换文件列表子菜单
function toggleFileSubmenu() {
  showFileSubmenu.value = !showFileSubmenu.value;
  // 加载文件列表
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

// 格式化日期
function formatDate(date: Date | string | undefined) {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// 计算属性：过滤后的文件列表
const filteredFiles = computed(() => {
  if (!fileFilterText.value) {
    return files.value;
  }
  return files.value.filter((file: DesignerFile) => 
    file.name.toLowerCase().includes(fileFilterText.value.toLowerCase())
  );
});

// 从子菜单选择文件
function selectFileFromSubmenu(file: DesignerFile) {
  showFileSubmenu.value = false;
  showFileMenu.value = false;
  loadFile(file);
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
      
      // 如果重命名的是当前文件，更新当前文件名
      if (currentFileId.value === file.id) {
        currentFileName.value = newName;
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
      
      // 如果删除的是当前文件，重置当前文件
      if (currentFileId.value === file.id) {
        currentFileName.value = '未命名报表';
        currentFileId.value = null;
      }
    }
  }
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
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

function createNewFile() {
  showFileMenu.value = false;
  // 创建新文件的逻辑
  const timestamp = new Date().getTime();
  currentFileName.value = `未命名报表${timestamp}`;
  currentFileId.value = `file_${timestamp}`;
  
  // 重置报表数据
  reportProperties.value = {
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
  };
  
  bands.value = [
    { type: BAND_TYPE_CONSTANTS.TITLE as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.TITLE] || 50, elements: [] },
    { type: BAND_TYPE_CONSTANTS.PAGE_HEADER as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.PAGE_HEADER] || 50, elements: [] },
    { type: BAND_TYPE_CONSTANTS.COLUMN_HEADER as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.COLUMN_HEADER] || 30, elements: [] },
    { type: BAND_TYPE_CONSTANTS.DETAIL as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.DETAIL] || 100, elements: [] },
    { type: BAND_TYPE_CONSTANTS.COLUMN_FOOTER as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.COLUMN_FOOTER] || 30, elements: [] },
    { type: BAND_TYPE_CONSTANTS.PAGE_FOOTER as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.PAGE_FOOTER] || 40, elements: [] },
    { type: BAND_TYPE_CONSTANTS.SUMMARY as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.SUMMARY] || 60, elements: [] }
  ];
  
  // 更新selectedBandTypes以匹配新的bands
  selectedBandTypes.value = bands.value.map(band => band.type);
  
  reportFields.value = [];
  reportParameters.value = [];
  jrxmlContent.value = '';
  
  // 清除当前选中的元素
  selectedElement.value = null;
  selectedBandIndex.value = null;
}

function openLocalFile() {
  showFileMenu.value = false;
  // 打开本地文件的逻辑
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
          alert('文件格式不正确，无法加载');
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

function saveCurrentFileToStorage() {
  showFileMenu.value = false;
  // 保存当前文件到本地存储
  const fileData = saveCurrentFile();
  
  try {
    // 从localStorage获取现有文件列表
    const storedFiles = localStorage.getItem('pdfDesignerFiles');
    const files = storedFiles ? JSON.parse(storedFiles) : [];
    
    // 查找当前文件是否已存在
    const existingFileIndex = files.findIndex((file: any) => file.id === currentFileId.value);
    
    if (existingFileIndex !== -1) {
      // 更新现有文件
      files[existingFileIndex] = {
        ...files[existingFileIndex],
        content: JSON.stringify(fileData),
        lastModified: new Date().toISOString()
      };
    } else if (currentFileId.value) {
      // 添加新文件
      files.push({
        id: currentFileId.value,
        name: currentFileName.value,
        content: JSON.stringify(fileData),
        lastModified: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
    } else {
      // 如果没有文件ID，创建一个新文件
      const newId = `file_${new Date().getTime()}`;
      currentFileId.value = newId;
      files.push({
        id: newId,
        name: currentFileName.value,
        content: JSON.stringify(fileData),
        lastModified: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
    }
    
    // 保存更新后的文件列表
    localStorage.setItem('pdfDesignerFiles', JSON.stringify(files));
    alert('文件保存成功');
  } catch (error) {
    console.error('保存文件失败:', error);
    alert('保存文件失败');
  }
}

function saveAsLocalFile() {
  showFileMenu.value = false;
  // 另存为文件的逻辑
  const fileData = saveCurrentFile();
  const content = JSON.stringify(fileData, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentFileName.value}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function loadFile(fileData: any) {
  try {
    // 解析文件内容
    const fileContent = typeof fileData.content === 'string' 
      ? JSON.parse(fileData.content) 
      : fileData;
      
    // 加载文件数据到当前报表
    if (fileContent.reportProperties) {
      reportProperties.value = { ...reportProperties.value, ...fileContent.reportProperties };
    }
    
    if (fileContent.bands) {
      bands.value = fileContent.bands;
      // 更新selectedBandTypes以匹配加载的bands
      selectedBandTypes.value = fileContent.bands.map((band: Band) => band.type);
    }
    
    if (fileContent.reportFields) {
      reportFields.value = fileContent.reportFields;
    }
    
    if (fileContent.reportParameters) {
      reportParameters.value = fileContent.reportParameters;
    }
    
    if (fileContent.jrxmlContent) {
      jrxmlContent.value = fileContent.jrxmlContent;
    }
    
    // 更新当前文件信息
    currentFileName.value = fileData.name || '未命名报表';
    currentFileId.value = fileData.id || null;
    
    // 保存最后编辑的文件信息到localStorage
    if (fileData.id) {
      localStorage.setItem('pdfDesignerLastFile', JSON.stringify({
        id: fileData.id,
        name: fileData.name
      }));
    }
    
    // 清除当前选中的元素
    selectedElement.value = null;
    selectedBandIndex.value = null;
  } catch (error) {
    console.error('加载文件失败:', error);
    alert('文件格式不正确，无法加载');
  }
}

function saveCurrentFile() {
  // 准备要保存的数据
  const fileData = {
    id: currentFileId.value,
    name: currentFileName.value,
    reportProperties: reportProperties.value,
    bands: bands.value,
    reportFields: reportFields.value,
    reportParameters: reportParameters.value,
    jrxmlContent: jrxmlContent.value,
    lastModified: new Date().toISOString()
  };
  
  // 返回文件数据
  return fileData;
}

// 可用元素
const elements = ref([
  { type: ELEMENT_TYPE_CONSTANTS.STATIC_TEXT, name: '静态文本' },
  { type: ELEMENT_TYPE_CONSTANTS.TEXT_FIELD, name: '动态文本' },
  { type: ELEMENT_TYPE_CONSTANTS.IMAGE, name: '图片' },
  { type: ELEMENT_TYPE_CONSTANTS.LINE, name: '线条' }
]);

// 定义元素接口
// 使用从types/index.ts导入的Pen和Box接口

// 使用从types/index.ts导入的接口

// 报表区域
const bands = ref<Band[]>([
  { type: BAND_TYPE_CONSTANTS.TITLE as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.TITLE] || 50, elements: [] },
  { type: BAND_TYPE_CONSTANTS.PAGE_HEADER as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.PAGE_HEADER] || 50, elements: [] },
  { type: BAND_TYPE_CONSTANTS.COLUMN_HEADER as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.COLUMN_HEADER] || 30, elements: [] },
  { type: BAND_TYPE_CONSTANTS.DETAIL as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.DETAIL] || 100, elements: [] }, // 默认给detail区域100的高度
  { type: BAND_TYPE_CONSTANTS.COLUMN_FOOTER as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.COLUMN_FOOTER] || 30, elements: [] },
  { type: BAND_TYPE_CONSTANTS.PAGE_FOOTER as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.PAGE_FOOTER] || 40, elements: [] },
  { type: BAND_TYPE_CONSTANTS.SUMMARY as BandType, height: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.SUMMARY] || 60, elements: [] }
]);

// 所有可能的band类型
const allBandTypes = [
  { type: BAND_TYPE_CONSTANTS.TITLE as BandType, name: '标题', defaultHeight: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.TITLE] || 80 },
  { type: BAND_TYPE_CONSTANTS.PAGE_HEADER as BandType, name: '页眉', defaultHeight: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.PAGE_HEADER] || 50 },
  { type: BAND_TYPE_CONSTANTS.COLUMN_HEADER as BandType, name: '列标题', defaultHeight: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.COLUMN_HEADER] || 30 },
  { type: BAND_TYPE_CONSTANTS.DETAIL as BandType, name: '详细数据', defaultHeight: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.DETAIL] || 100 },
  { type: BAND_TYPE_CONSTANTS.COLUMN_FOOTER as BandType, name: '列脚', defaultHeight: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.COLUMN_FOOTER] || 30 },
  { type: BAND_TYPE_CONSTANTS.PAGE_FOOTER as BandType, name: '页脚', defaultHeight: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.PAGE_FOOTER] || 40 },
  { type: BAND_TYPE_CONSTANTS.SUMMARY as BandType, name: '汇总', defaultHeight: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.SUMMARY] || 60 },
  { type: BAND_TYPE_CONSTANTS.BACKGROUND as BandType, name: '背景', defaultHeight: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.BACKGROUND] || 0 },
  { type: BAND_TYPE_CONSTANTS.LAST_PAGE_FOOTER as BandType, name: '末页页脚', defaultHeight: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.LAST_PAGE_FOOTER] || 40 },
  { type: BAND_TYPE_CONSTANTS.NO_DATA as BandType, name: '无数据', defaultHeight: BAND_HEIGHT_CONSTANTS[BAND_TYPE_CONSTANTS.NO_DATA] || 50 }
];

// 当前选中的band类型
const selectedBandTypes = ref<string[]>(bands.value.map(band => band.type));

// 数据字段
const reportFields = ref<ReportField[]>([
]);

// 报表参数
const reportParameters = ref<ReportParameter[]>([
]);

// 历史记录栈 - 用于撤销功能
interface HistoryState {
  reportProperties: typeof reportProperties.value;
  bands: typeof bands.value;
  reportFields: typeof reportFields.value;
  reportParameters: typeof reportParameters.value;
}

// 超出边界的元素
const outOfBoundsElements = ref<Array<{bandIndex: number, elementIndex: number, element: DesignElement}>>([]);

// 检查并更新超出边界的元素
function updateOutOfBoundsElements() {
  // 安全检查，确保bands和reportProperties已初始化
  if (!bands.value || !reportProperties.value) {
    console.warn('bands或reportProperties未初始化，跳过边界检查');
    return;
  }
  
  // 获取所有超出边界的元素
  const outOfBounds = getOutOfBoundsElements(bands.value, reportProperties.value);
  outOfBoundsElements.value = outOfBounds;
  
  // 如果有超出边界的元素，在控制台输出警告
  if (outOfBounds.length > 0) {
    console.warn(`发现 ${outOfBounds.length} 个超出边界的元素:`, outOfBounds);
  }
}

// 历史记录栈 - 用于撤销功能
const historyStack = ref<HistoryState[]>([]);
const redoStack = ref<HistoryState[]>([]);
const MAX_HISTORY_SIZE = HISTORY_CONSTANTS.MAX_HISTORY_SIZE; // 最大历史记录数量
const isDraggingOrResizing = ref(false); // 标记是否正在拖动或调整大小

// 保存当前状态到历史记录
function saveStateToHistory() {
  // 创建状态快照（深拷贝）
  const stateSnapshot: HistoryState = {
    reportProperties: JSON.parse(JSON.stringify(reportProperties.value)),
    bands: JSON.parse(JSON.stringify(bands.value)),
    reportFields: JSON.parse(JSON.stringify(reportFields.value)),
    reportParameters: JSON.parse(JSON.stringify(reportParameters.value))
  };
  
  // 添加到历史栈
  historyStack.value.push(stateSnapshot);
  
  // 如果历史栈超过最大限制，删除最旧的记录
  if (historyStack.value.length > MAX_HISTORY_SIZE) {
    historyStack.value.shift();
  }
  
  // 清空重做栈
  redoStack.value = [];
}

// 撤销功能
function undo() {
  if (historyStack.value.length === 0) return;
  
  // 保存当前状态到重做栈
  const currentState: HistoryState = {
    reportProperties: JSON.parse(JSON.stringify(reportProperties.value)),
    bands: JSON.parse(JSON.stringify(bands.value)),
    reportFields: JSON.parse(JSON.stringify(reportFields.value)),
    reportParameters: JSON.parse(JSON.stringify(reportParameters.value))
  };
  redoStack.value.push(currentState);
  
  // 恢复上一个状态
  const previousState = historyStack.value.pop()!;
  reportProperties.value = previousState.reportProperties;
  bands.value = previousState.bands;
  reportFields.value = previousState.reportFields;
  reportParameters.value = previousState.reportParameters;
  
  // 更新JRXML
  updateJRXML();
}

// 重做功能
function redo() {
  if (redoStack.value.length === 0) return;
  
  // 保存当前状态到历史栈
  const currentState: HistoryState = {
    reportProperties: JSON.parse(JSON.stringify(reportProperties.value)),
    bands: JSON.parse(JSON.stringify(bands.value)),
    reportFields: JSON.parse(JSON.stringify(reportFields.value)),
    reportParameters: JSON.parse(JSON.stringify(reportParameters.value))
  };
  historyStack.value.push(currentState);
  
  // 应用下一个状态
  const nextState = redoStack.value.pop()!;
  reportProperties.value = nextState.reportProperties;
  bands.value = nextState.bands;
  reportFields.value = nextState.reportFields;
  reportParameters.value = nextState.reportParameters;
  
  // 更新JRXML
  updateJRXML();
}

// 添加新参数
// 移除未使用的参数管理函数

// 选中状态
const selectedBandIndex = ref<number | null>(null);
const selectedElement = ref<{bandIndex: number, elementIndex: number} | null>(null);
const editingElement = ref<{bandIndex: number, elementIndex: number} | null>(null);
const editInput = ref<HTMLInputElement | null>(null);

// 报表元素过滤文本
const elementFilterText = ref('');

// 报表设计区域焦点状态
const isDesignAreaFocused = ref(true); // 默认聚焦设计区域

// 设置设计区域焦点
const setDesignAreaFocused = () => {
  isDesignAreaFocused.value = true;
};

// 移除设计区域焦点
const removeDesignAreaFocused = () => {
  isDesignAreaFocused.value = false;
};

// 计算属性
const paperWidth = computed(() => reportProperties.value?.pageWidth || REPORT_CONSTANTS.DEFAULT_PAGE_WIDTH);
const paperHeight = computed(() => reportProperties.value?.pageHeight || REPORT_CONSTANTS.DEFAULT_PAGE_HEIGHT);
const currentElement = computed(() => {
  if (selectedElement.value && bands.value && Array.isArray(bands.value)) {
    const band = bands.value[selectedElement.value.bandIndex];
    if (band && band.elements && Array.isArray(band.elements)) {
      return band.elements[selectedElement.value.elementIndex];
    }
  }
  return null;
});

// 获取所有报表元素
const getAllReportElements = computed(() => {
  const allElements: { element: DesignElement, bandIndex: number, elementIndex: number }[] = [];
  
  if (bands.value && Array.isArray(bands.value)) {
    bands.value.forEach((band, bandIndex) => {
      if (band && band.elements && Array.isArray(band.elements)) {
        band.elements.forEach((element, elementIndex) => {
          allElements.push({
            element,
            bandIndex,
            elementIndex
          });
        });
      }
    });
  }
  
  return allElements;
});

// 过滤后的报表元素
const filteredReportElements = computed(() => {
  if (!elementFilterText.value) {
    return getAllReportElements.value;
  }
  
  const filterText = elementFilterText.value.toLowerCase();
  return getAllReportElements.value.filter(item => {
    const element = item.element;
    
    // 对静态文本通过内容过滤
    if (element.type === 'staticText' && element.text) {
      return element.text.toLowerCase().includes(filterText);
    }
    
    // 对动态文本通过变量名过滤
    if (element.type === 'textField' && element.fieldName) {
      return element.fieldName.toLowerCase().includes(filterText);
    }
    
    // 对其他类型，通过类型名称过滤
    const typeName = getElementTypeName(element.type).toLowerCase();
    return typeName.includes(filterText);
  });
});

// 按band分组的报表元素
const groupedReportElements = computed(() => {
  const groups: Record<string, Array<{ element: DesignElement, bandIndex: number, elementIndex: number }>> = {};
  
  if (!filteredReportElements.value || !bands.value || !Array.isArray(bands.value)) {
    return groups;
  }
  
  filteredReportElements.value.forEach(item => {
    if (!bands.value || item.bandIndex >= bands.value.length) return;
    const band = bands.value[item.bandIndex];
    if (!band) return;
    const bandType = band.type;
    const bandName = getBandDisplayName(bandType);
    
    if (!groups[bandName]) {
      groups[bandName] = [];
    }
    
    groups[bandName].push(item);
  });
  
  return groups;
});

// 标尺相关计算属性
const horizontalRulerTicks = computed(() => {
  const ticks = [];
  const width = paperWidth.value;
  const unit = RULER_CONSTANTS.UNIT_SIZE; // 减小基本单位，从10px改为5px，增加刻度密度
  
  for (let i = 0; i <= width; i += unit) {
    ticks.push({
      position: i, // 不应用缩放比例，保持实际位置
      major: i % RULER_CONSTANTS.MAJOR_TICK_INTERVAL === 0 // 每25px一个主要刻度，从50px改为25px
    });
  }
  
  return ticks;
});

const horizontalRulerLabels = computed(() => {
  const labels = [];
  const width = paperWidth.value;
  
  for (let i = 0; i <= width; i += RULER_CONSTANTS.LABEL_INTERVAL) { // 每25px显示一个标签，从50px改为25px
    labels.push({
      position: i, // 不应用缩放比例，保持实际位置
      value: i.toString()
    });
  }
  
  return labels;
});

const verticalRulerTicks = computed(() => {
  const ticks = [];
  const height = paperHeight.value;
  const unit = RULER_CONSTANTS.UNIT_SIZE; // 减小基本单位，从10px改为5px，增加刻度密度
  
  for (let i = 0; i <= height; i += unit) {
    ticks.push({
      position: i, // 不应用缩放比例，保持实际位置
      major: i % RULER_CONSTANTS.MAJOR_TICK_INTERVAL === 0 // 每25px一个主要刻度，从50px改为25px
    });
  }
  
  return ticks;
});

const verticalRulerLabels = computed(() => {
  const labels = [];
  const height = paperHeight.value;
  
  for (let i = 0; i <= height; i += RULER_CONSTANTS.LABEL_INTERVAL) { // 每25px显示一个标签，从50px改为25px
    labels.push({
      position: i, // 不应用缩放比例，保持实际位置
      value: i.toString()
    });
  }
  
  return labels;
});

// 拖拽相关
const draggingInfo = ref<{bandIndex: number, elementIndex: number, startX: number, startY: number} | null>(null);
const highlightedBandIndex = ref<number | null>(null); // 高亮显示的目标band索引
// 拖动时显示的坐标信息
const dragCoordinates = ref<{x: number, y: number, visible: boolean, bandName: string}>({ x: 0, y: 0, visible: false, bandName: '' });
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
    
    // 考虑缩放比例
    const currentZoom = zoomLevel.value;
    const scaledX = x / currentZoom;
    const scaledY = y / currentZoom;
    
    // 找到对应的band
    let bandIndex = 0;
    let currentY = 0;
    if (bands.value && Array.isArray(bands.value)) {
      for (let i = 0; i < bands.value.length; i++) {
        const band = bands.value[i];
        if (band && scaledY >= currentY && scaledY <= currentY + band.height) {
          bandIndex = i;
          break;
        }
        if (band) {
          currentY += band.height;
        }
      }
    }
    
    // 创建新元素
    const newElement: DesignElement = {
      type: elementData.type,
      x: Math.max(0, scaledX - 50), // 减去元素宽度的一半以居中
      y: Math.max(0, scaledY - currentY), // 相对于band的位置
      width: 100,
      height: 30,
      ...getDefaultElementProperties(elementData.type)
    };
    
    const targetBand = bands.value[bandIndex];
    if (targetBand && targetBand.elements) {
      // 确保元素不会超出边距限制
      // 注意：由于现在使用padding，元素坐标是相对于内容区域的
      const availableWidth = paperWidth.value - (reportProperties.value?.leftMargin || 0) - (reportProperties.value?.rightMargin || 0);
      
      // 限制元素不超出右边界
      if (newElement.x + newElement.width > availableWidth) {
        newElement.x = availableWidth - newElement.width;
      }
      
      // 确保元素宽度不超过可用空间
      if (newElement.width > availableWidth) {
        newElement.width = availableWidth;
      }
      
      // 确保元素不超出band高度
      if (newElement.y + newElement.height > targetBand.height) {
        newElement.y = targetBand.height - newElement.height;
      }
      
      targetBand.elements.push(newElement);
      
      // 选中刚添加的元素
      selectElement(bandIndex, targetBand.elements.length - 1);
      
      // 更新JRXML
      updateJRXML();
    }
  }
  
  // 清除高亮状态
  highlightedBandIndex.value = null;
};

// 处理拖动过程中的视觉反馈
const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  
  // 获取paper元素作为参考点
  const paper = document.querySelector('.paper') as HTMLElement;
  if (!paper) return;
  
  const paperRect = paper.getBoundingClientRect();
  // 计算相对于paper的坐标
  const y = event.clientY - paperRect.top;
  
  // 考虑缩放比例
  const currentZoom = zoomLevel.value;
  const scaledY = y / currentZoom;
  
  // 找到对应的band
  let bandIndex = -1;
  let currentY = 0;
  for (let i = 0; i < bands.value.length; i++) {
    const band = bands.value[i];
    if (band && scaledY >= currentY && scaledY <= currentY + band.height) {
      bandIndex = i;
      break;
    }
    if (band) {
      currentY += band.height;
    }
  }
  
  // 更新高亮状态
  highlightedBandIndex.value = bandIndex;
};

// 处理拖动离开事件
const handleDragLeave = (event: DragEvent) => {
  // 检查是否真的离开了paper区域
  const paper = document.querySelector('.paper') as HTMLElement;
  if (paper && !paper.contains(event.relatedTarget as Node)) {
    highlightedBandIndex.value = null;
  }
};

// 检测对齐线
const detectAlignmentLines = (currentElement: DesignElement, currentBandIndex: number, updateState: boolean = true) => {
  const threshold = 3; // 对齐阈值，像素 - 减小阈值使吸附更精确
  const verticalAlignmentLines: number[] = []; // 垂直对齐线（X坐标）
  const horizontalAlignmentLines: number[] = []; // 水平对齐线（Y坐标）
  
  // 用于存储吸附信息的对象
  const snapInfo = {
    horizontal: null as { position: number; offset: number } | null,
    vertical: null as { position: number; offset: number } | null
  };
  
  // 获取页边距
  const { leftMargin = 0, topMargin = 0 } = reportProperties.value || {};
  
  // 计算当前band的Y坐标偏移
  let currentBandY = 0;
  const bandSpacing = BAND_CONSTANTS.SPACING; // band之间的间距，与DesignerCanvas.vue中的margin-bottom一致
  for (let i = 0; i < currentBandIndex; i++) {
    currentBandY += bands.value[i]?.height || 0;
    if (i < currentBandIndex - 1) {
      currentBandY += bandSpacing; // 只在band之间添加间距，不在最后一个band后添加
    }
  }
  
  // 获取当前元素的边界
  const currentLeft = currentElement.x;
  const currentRight = currentElement.x + currentElement.width;
  const currentTop = currentElement.y;
  const currentBottom = currentElement.y + currentElement.height;
  const currentCenterX = currentElement.x + currentElement.width / 2;
  const currentCenterY = currentElement.y + currentElement.height / 2;
  
  // 遍历所有band和元素，检测对齐关系
  let bandOffsetY = 0;
  bands.value.forEach((band, bandIndex) => {
    band.elements.forEach((element, _elementIndex) => {
      // 跳过当前元素
      if (bandIndex === currentBandIndex && element === currentElement) return;
      
      // 获取其他元素的边界
      const otherLeft = element.x;
      const otherRight = element.x + element.width;
      const otherTop = element.y;
      const otherBottom = element.y + element.height;
      const otherCenterX = element.x + element.width / 2;
      const otherCenterY = element.y + element.height / 2;
      
      // 检测垂直对齐线（左右对齐）
      // 左边对齐
      if (Math.abs(currentLeft - otherLeft) < threshold) {
        const linePosition = otherLeft + leftMargin;
        verticalAlignmentLines.push(linePosition);
        
        // 更新吸附信息
        if (!snapInfo.horizontal || Math.abs(currentLeft - otherLeft) < Math.abs(snapInfo.horizontal.offset)) {
          snapInfo.horizontal = {
            position: linePosition,
            offset: otherLeft - currentLeft
          };
        }
      }
      // 右边对齐
      if (Math.abs(currentRight - otherRight) < threshold) {
        const linePosition = otherRight + leftMargin;
        verticalAlignmentLines.push(linePosition);
        
        // 更新吸附信息
        if (!snapInfo.horizontal || Math.abs(currentRight - otherRight) < Math.abs(snapInfo.horizontal.offset)) {
          snapInfo.horizontal = {
            position: linePosition,
            offset: otherRight - currentRight
          };
        }
      }
      // 中心对齐
      if (Math.abs(currentCenterX - otherCenterX) < threshold) {
        const linePosition = otherCenterX + leftMargin;
        verticalAlignmentLines.push(linePosition);
        
        // 更新吸附信息
        if (!snapInfo.horizontal || Math.abs(currentCenterX - otherCenterX) < Math.abs(snapInfo.horizontal.offset)) {
          snapInfo.horizontal = {
            position: linePosition,
            offset: otherCenterX - currentCenterX
          };
        }
      }
      // 左边对齐到其他元素的右边
      if (Math.abs(currentLeft - otherRight) < threshold) {
        const linePosition = otherRight + leftMargin;
        verticalAlignmentLines.push(linePosition);
        
        // 更新吸附信息
        if (!snapInfo.horizontal || Math.abs(currentLeft - otherRight) < Math.abs(snapInfo.horizontal.offset)) {
          snapInfo.horizontal = {
            position: linePosition,
            offset: otherRight - currentLeft
          };
        }
      }
      // 右边对齐到其他元素的左边
      if (Math.abs(currentRight - otherLeft) < threshold) {
        const linePosition = otherLeft + leftMargin;
        verticalAlignmentLines.push(linePosition);
        
        // 更新吸附信息
        if (!snapInfo.horizontal || Math.abs(currentRight - otherLeft) < Math.abs(snapInfo.horizontal.offset)) {
          snapInfo.horizontal = {
            position: linePosition,
            offset: otherLeft - currentRight
          };
        }
      }
      
      // 检测水平对齐线（上下对齐）
      // 对于相同band中的元素，进行完整的对齐检测和吸附
      if (bandIndex === currentBandIndex) {
        // 顶部对齐
        if (Math.abs(currentTop - otherTop) < threshold) {
          // 添加当前band的Y坐标偏移到参考线位置
          const linePosition = otherTop + topMargin + bandOffsetY;
          horizontalAlignmentLines.push(linePosition);
          
          // 更新吸附信息，元素坐标不需要考虑band偏移
          if (!snapInfo.vertical || Math.abs(currentTop - otherTop) < Math.abs(snapInfo.vertical.offset)) {
            snapInfo.vertical = {
              position: linePosition,
              offset: otherTop - currentTop
            };
          }
        }
        // 底部对齐
        if (Math.abs(currentBottom - otherBottom) < threshold) {
          // 添加当前band的Y坐标偏移到参考线位置
          const linePosition = otherBottom + topMargin + bandOffsetY;
          horizontalAlignmentLines.push(linePosition);
          
          // 更新吸附信息，元素坐标不需要考虑band偏移
          if (!snapInfo.vertical || Math.abs(currentBottom - otherBottom) < Math.abs(snapInfo.vertical.offset)) {
            snapInfo.vertical = {
              position: linePosition,
              offset: otherBottom - currentBottom
            };
          }
        }
        // 中心对齐
        if (Math.abs(currentCenterY - otherCenterY) < threshold) {
          // 添加当前band的Y坐标偏移到参考线位置
          const linePosition = otherCenterY + topMargin + bandOffsetY;
          horizontalAlignmentLines.push(linePosition);
          
          // 更新吸附信息，元素坐标不需要考虑band偏移
          if (!snapInfo.vertical || Math.abs(currentCenterY - otherCenterY) < Math.abs(snapInfo.vertical.offset)) {
            snapInfo.vertical = {
              position: linePosition,
              offset: otherCenterY - currentCenterY
            };
          }
        }
        // 顶部对齐到其他元素的底部
        if (Math.abs(currentTop - otherBottom) < threshold) {
          // 添加当前band的Y坐标偏移到参考线位置
          const linePosition = otherBottom + topMargin + bandOffsetY;
          horizontalAlignmentLines.push(linePosition);
          
          // 更新吸附信息，元素坐标不需要考虑band偏移
          if (!snapInfo.vertical || Math.abs(currentTop - otherBottom) < Math.abs(snapInfo.vertical.offset)) {
            snapInfo.vertical = {
              position: linePosition,
              offset: otherBottom - currentTop
            };
          }
        }
        // 底部对齐到其他元素的顶部
        if (Math.abs(currentBottom - otherTop) < threshold) {
          // 添加当前band的Y坐标偏移到参考线位置
          const linePosition = otherTop + topMargin + bandOffsetY;
          horizontalAlignmentLines.push(linePosition);
          
          // 更新吸附信息，元素坐标不需要考虑band偏移
          if (!snapInfo.vertical || Math.abs(currentBottom - otherTop) < Math.abs(snapInfo.vertical.offset)) {
            snapInfo.vertical = {
              position: linePosition,
              offset: otherTop - currentBottom
            };
          }
        }
      }
      // 对于不同band中的元素，只显示参考线但不进行吸附
      else {
        // 获取当前鼠标在页面中的Y坐标
        const paperEl = document.querySelector('.paper') as HTMLElement;
        if (paperEl) {
          const paperRect = paperEl.getBoundingClientRect();
          const currentZoom = zoomLevel.value;
          
          // 计算当前元素在页面中的实际Y坐标
          const elementPageY = paperRect.top + topMargin + bandOffsetY + currentTop * currentZoom;
          
          // 检查其他元素的Y坐标是否与当前元素对齐
          // 顶部对齐
          const otherElementPageY = paperRect.top + topMargin + bandOffsetY + otherTop * currentZoom;
          if (Math.abs(elementPageY - otherElementPageY) < threshold * currentZoom) {
            // 添加其他band的Y坐标偏移到参考线位置
            const linePosition = otherTop + topMargin + bandOffsetY;
            horizontalAlignmentLines.push(linePosition);
          }
          
          // 底部对齐
          const otherElementBottomPageY = paperRect.top + topMargin + bandOffsetY + otherBottom * currentZoom;
          if (Math.abs(elementPageY - otherElementBottomPageY) < threshold * currentZoom) {
            // 添加其他band的Y坐标偏移到参考线位置
            const linePosition = otherBottom + topMargin + bandOffsetY;
            horizontalAlignmentLines.push(linePosition);
          }
          
          // 中心对齐
          const otherElementCenterPageY = paperRect.top + topMargin + bandOffsetY + otherCenterY * currentZoom;
          if (Math.abs(elementPageY - otherElementCenterPageY) < threshold * currentZoom) {
            // 添加其他band的Y坐标偏移到参考线位置
            const linePosition = otherCenterY + topMargin + bandOffsetY;
            horizontalAlignmentLines.push(linePosition);
          }
        }
      }
    });
    
    // 更新band的Y坐标偏移，考虑band之间的间距
    bandOffsetY += band.height + bandSpacing;
  });
  
  // 更新对齐线状态
  if (updateState) {
    alignmentLines.value = {
      horizontal: [...new Set(horizontalAlignmentLines)], // 水平对齐线（Y坐标）
      vertical: [...new Set(verticalAlignmentLines)] // 垂直对齐线（X坐标）
    };
  }
  
  // 返回吸附信息
  return snapInfo;
};

// 清除对齐线
const clearAlignmentLines = () => {
  alignmentLines.value = {
    horizontal: [],
    vertical: []
  };
};
const getDefaultElementProperties = (type: string): Partial<DesignElement> => {
  // 使用报表的默认字体设置
  const defaultFontProps = {
    fontFamily: reportProperties.value?.defaultFont?.name || FONT_CONSTANTS.SANS_SERIF,
    fontSize: reportProperties.value?.defaultFont?.size || REPORT_CONSTANTS.DEFAULT_FONT_SIZE,
    isBold: reportProperties.value?.defaultFont?.isBold || false,
    isItalic: reportProperties.value?.defaultFont?.isItalic || false,
    isUnderline: reportProperties.value?.defaultFont?.isUnderline || false
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
      return { lineDirection: 'TopDown', lineWidth: 1 };
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
  // 快速更新选中状态，避免不必要的DOM操作
  selectedElement.value = { bandIndex, elementIndex };
  selectedBandIndex.value = null;
  
  // 自动隐藏底部面板
  showBottomPanel.value = false;
  
  // 确保元素有box属性，如果没有则初始化
  const band = bands.value[bandIndex];
  const element = band?.elements[elementIndex];
  
  if (element && !element.box) {
    // 使用initBox函数初始化box属性
    initBox();
  }
  
  // 移除了昂贵的DOM查询和动画效果，通过Vue的响应式系统和CSS类来管理选择状态
};

// 缓存事件处理函数，避免重复创建
let cachedMouseMoveHandler: ((e: MouseEvent) => void) | null = null;
let cachedMouseUpHandler: ((e: MouseEvent) => void) | null = null;

// 开始拖拽元素
const startDragging = (event: MouseEvent, bandIndex: number, elementIndex: number) => {
  event.stopPropagation();
  selectElement(bandIndex, elementIndex);
  
  // 自动隐藏底部面板
  showBottomPanel.value = false;
  
  const band = bands.value[bandIndex];
  const draggedElement = band?.elements[elementIndex];
  
  if (draggedElement) {
    // 获取当前缩放比例
    const currentZoom = zoomLevel.value;
    
    // 获取paper元素的位置信息，用于更准确的坐标计算
    const paperEl = document.querySelector('.paper') as HTMLElement;
    let paperOffsetX = 0;
    let paperOffsetY = 0;
    
    if (paperEl) {
      const paperRect = paperEl.getBoundingClientRect();
      // 考虑缩放比例的偏移量
      paperOffsetX = paperRect.left;
      paperOffsetY = paperRect.top;
    }
    
    // 存储拖拽信息，考虑缩放比例
    draggingInfo.value = {
      bandIndex,
      elementIndex,
      startX: ((event.clientX - paperOffsetX) / currentZoom) - draggedElement.x,
      startY: ((event.clientY - paperOffsetY) / currentZoom) - draggedElement.y
    };
    
    isDraggingOrResizing.value = true;
    
    // 使用缓存的事件处理函数，避免每次拖拽都创建新的函数
    if (!cachedMouseMoveHandler) {
      cachedMouseMoveHandler = (e: MouseEvent) => {
        if (draggingInfo.value) {
          const currentBand = bands.value[draggingInfo.value.bandIndex];
          const currentElement = currentBand?.elements[draggingInfo.value.elementIndex];
          
          if (currentBand && currentElement) {
            // 获取当前缩放比例
            const currentZoom = zoomLevel.value;
            
            // 计算元素相对于paper的位置，考虑缩放比例
            // 注意：由于现在使用padding，元素坐标是相对于内容区域的
            // 计算可用宽度，不除以currentZoom因为newX计算已经考虑了缩放
            const availableWidth = (paperWidth.value - (reportProperties.value?.leftMargin || 0) - (reportProperties.value?.rightMargin || 0));
            
            // 获取paper元素的位置信息，用于更准确的坐标计算
            let paperOffsetX = 0;
            let paperOffsetY = 0;
            const paperEl = document.querySelector('.paper') as HTMLElement;
            
            if (paperEl) {
              const paperRect = paperEl.getBoundingClientRect();
              // 考虑缩放比例的偏移量
              paperOffsetX = paperRect.left;
              paperOffsetY = paperRect.top;
            }
            
            // 计算新的X和Y坐标，考虑缩放和偏移
            let newX = Math.max(0, Math.min(((e.clientX - paperOffsetX) / currentZoom) - draggingInfo.value.startX, availableWidth - currentElement.width));
            let newY = ((e.clientY - paperOffsetY) / currentZoom) - draggingInfo.value.startY; // 移除y坐标的下限限制
            
            // 计算元素在页面中的绝对位置（相对于整个页面）
            const elementTopInPage = (e.clientY - paperOffsetY) / currentZoom;
            const elementBottomInPage = elementTopInPage + currentElement.height;
            
            // 获取第一个band和最后一个band的位置信息
            const firstBandElement = document.querySelectorAll('.band')[0] as HTMLElement;
            const lastBandElement = document.querySelectorAll('.band')[bands.value.length - 1] as HTMLElement;
            
            if (firstBandElement && lastBandElement) {
              const firstBandRect = firstBandElement.getBoundingClientRect();
              const lastBandRect = lastBandElement.getBoundingClientRect();
              const paperRect = paperEl.getBoundingClientRect();
              
              // 计算第一个band和最后一个band相对于页面的位置
              const firstBandTopInPage = (firstBandRect.top - paperRect.top) / currentZoom;
              const lastBandBottomInPage = (lastBandRect.bottom - paperRect.top) / currentZoom;
              
              // 限制元素顶部不能超出第一个band的上边界
              if (elementTopInPage < firstBandTopInPage) {
                const adjustment = firstBandTopInPage - elementTopInPage;
                newY += adjustment;
              }
              
              // 限制元素底部不能超出最后一个band的下边界
              if (elementBottomInPage > lastBandBottomInPage) {
                const adjustment = elementBottomInPage - lastBandBottomInPage;
                newY -= adjustment;
              }
            }
            
            // 应用自动吸附功能
            if (enableSnapToGrid.value) {
              // 定义网格大小为3像素，减小吸附距离
              const gridSize = 3;
              
              // 对X坐标进行吸附
              const remainderX = newX % gridSize;
              if (remainderX < gridSize / 2) {
                newX = newX - remainderX;
              } else {
                newX = newX + (gridSize - remainderX);
              }
              
              // 对Y坐标进行吸附
              const remainderY = newY % gridSize;
              if (remainderY < gridSize / 2) {
                newY = newY - remainderY;
              } else {
                newY = newY + (gridSize - remainderY);
              }
            }
            
            // 应用对齐线吸附功能
            if (enableSnapToAlignment.value) {
              // 创建临时元素对象用于检测对齐线
              const tempElement = { ...currentElement, x: newX, y: newY };
              const snapInfo = detectAlignmentLines(tempElement, draggingInfo.value.bandIndex, false);
              
              // 应用水平吸附
              if (snapInfo.horizontal) {
                newX += snapInfo.horizontal.offset;
              }
              
              // 应用垂直吸附
              if (snapInfo.vertical) {
                newY += snapInfo.vertical.offset;
              }
            }
            
            currentElement.x = newX;
            currentElement.y = newY;
            
            // 检测对齐线（使用最终位置）
            // 使用当前鼠标所在的band索引，以便在跨band拖拽时也能显示横向参考线
            const targetBandIndex = highlightedBandIndex.value !== null ? highlightedBandIndex.value : draggingInfo.value.bandIndex;
            detectAlignmentLines(currentElement, targetBandIndex);
            
            // 更新并显示坐标信息
            // 显示元素的相对坐标值
            let relativeX = Math.round(newX);
            let relativeY = Math.round(newY);
            
            // 使用已经获取的paperElement变量
            if (paperEl) {
              const bandElements = document.querySelectorAll('.band');
              
              // 计算元素在拖动过程中相对于目标band的坐标
              if (highlightedBandIndex.value !== null && bandElements[highlightedBandIndex.value]) {
                // 如果有高亮的band（表示鼠标当前所在的band），计算元素相对于这个band的坐标
                const targetBandElement = bandElements[highlightedBandIndex.value] as HTMLElement;
                const targetBandRect = targetBandElement.getBoundingClientRect();
                
                // 修复：使用元素的实际Y坐标（newY）而不是鼠标位置来计算相对Y坐标
                // 获取当前元素所在band的顶部位置
                const currentBandElement = bandElements[draggingInfo.value.bandIndex] as HTMLElement;
                const currentBandRect = currentBandElement.getBoundingClientRect();
                
                // 如果元素在不同的band，需要调整计算方式
                if (highlightedBandIndex.value !== draggingInfo.value.bandIndex) {
                  // 元素移动到不同的band，计算相对于新band的Y坐标
                  relativeY = Math.round(newY + (currentBandRect.top - targetBandRect.top) / currentZoom);
                } else {
                  // 元素在同一band内，使用元素的Y坐标
                  relativeY = Math.round(newY);
                }
                
                // 确保Y坐标是相对于目标band的相对值
                if (relativeY < 0) {
                  relativeY = 0;
                }
              }
            }
            
            dragCoordinates.value = {
              x: relativeX,
              y: relativeY,
              visible: true,
              bandName: ''
            };
            
            // 使用DOM元素的实际位置来计算目标band，提高准确性
            // 使用已经获取的paperElement变量
            if (paperEl) {
              let targetBandIndex = draggingInfo.value.bandIndex;
              
              // 获取所有band元素
              const bandElements = document.querySelectorAll('.band');
              for (let i = 0; i < bandElements.length; i++) {
                const bandElement = bandElements[i] as HTMLElement;
                const bandRect = bandElement.getBoundingClientRect();
                
                // 检查鼠标位置是否在当前band的范围内
                if (e.clientY >= bandRect.top && e.clientY <= bandRect.bottom) {
                  targetBandIndex = i;
                  break;
                }
              }
              
              highlightedBandIndex.value = targetBandIndex;
            }
            
            // 更新坐标显示元素的位置，使其跟随鼠标
            const coordinatesElement = document.querySelector('.coordinates-display') as HTMLElement;
            if (coordinatesElement) {
              // 获取当前鼠标所在band的名称
              let bandName = '';
              if (highlightedBandIndex.value !== null && 
                  bands.value[highlightedBandIndex.value] !== undefined) {
                const currentBand = bands.value[highlightedBandIndex.value];
                if (currentBand) {
                  bandName = getBandDisplayName(currentBand.type) + ' - ';
                }
              }
              
              // 考虑缩放比例的坐标显示
              coordinatesElement.style.left = (e.clientX + 10) + 'px';
              coordinatesElement.style.top = (e.clientY - 30) + 'px';
              
              // 更新dragCoordinates的值，让模板显示正确的坐标和band名称
              dragCoordinates.value.x = relativeX;
              dragCoordinates.value.y = relativeY;
              dragCoordinates.value.bandName = bandName;
            }
          }
        }
      };
    }
    
    if (!cachedMouseUpHandler) {
      cachedMouseUpHandler = (e: MouseEvent) => {
        // 保存状态到历史记录
        saveStateToHistory();
        
        if (draggingInfo.value) {
          const currentBand = bands.value[draggingInfo.value.bandIndex];
          const currentElement = currentBand?.elements[draggingInfo.value.elementIndex];
          
          if (currentBand && currentElement) {
            // 使用鼠标释放时的实际位置来确定目标band
            const paperEl = document.querySelector('.paper') as HTMLElement;
            let targetBandIndex = draggingInfo.value.bandIndex;
            
            if (paperEl) {
              // 获取所有band元素
              const bandElements = document.querySelectorAll('.band');
              for (let i = 0; i < bandElements.length; i++) {
                const bandElement = bandElements[i] as HTMLElement;
                const bandRect = bandElement.getBoundingClientRect();
                
                // 使用鼠标位置来确定目标band，确保元素始终移动到鼠标所在的band
                if (e.clientY >= bandRect.top && e.clientY <= bandRect.bottom) {
                  targetBandIndex = i;
                  break;
                }
              }
            }
            
            // 如果元素移动到了不同的band
            if (targetBandIndex !== draggingInfo.value.bandIndex) {
              // 如果元素是从第一个band移动到其他band，需要检查y坐标
              if (draggingInfo.value.bandIndex === 0 && targetBandIndex > 0) {
                // 从第一个band移动到其他band，不需要特殊处理
              } else if (draggingInfo.value.bandIndex > 0 && targetBandIndex === 0) {
                // 从其他band移动到第一个band，需要确保y坐标不小于0
                const targetBandElement = document.querySelectorAll('.band')[targetBandIndex] as HTMLElement | undefined;
                if (targetBandElement) {
                  // 使用拖拽过程中显示的Y坐标，而不是鼠标位置
                  currentElement.y = Math.max(0, dragCoordinates.value.y);
                }
              }
              
              const targetBand = bands.value[targetBandIndex];
              if (targetBand) {
                // 移除原band中的元素
                currentBand.elements.splice(draggingInfo.value.elementIndex, 1);
                
                // 计算元素相对于目标band的y坐标
                const targetBandElement = document.querySelectorAll('.band')[targetBandIndex] as HTMLElement | undefined;
                if (targetBandElement) {
                  // 使用拖拽过程中显示的Y坐标，而不是鼠标位置
                  // 确保Y坐标不小于0
                  currentElement.y = Math.max(0, dragCoordinates.value.y);
                
                  // 添加到新band中，使用相对于band的坐标
                  targetBand.elements.push(currentElement);
                
                  // 更新选中的元素索引
                  selectedElement.value = {
                    bandIndex: targetBandIndex,
                    elementIndex: targetBand.elements.length - 1
                  };
                }
              }
            }
            // 元素在同一band内移动，使用拖拽过程中显示的坐标值
            else {
              // 使用拖拽过程中显示的坐标值，确保元素位置与显示一致
              currentElement.x = dragCoordinates.value.x;
              currentElement.y = dragCoordinates.value.y;
            }
          }
        }
        
        // 清除高亮和坐标显示
        highlightedBandIndex.value = null;
        dragCoordinates.value.visible = false;
        
        // 清除对齐线
        clearAlignmentLines();
        
        draggingInfo.value = null;
        isDraggingOrResizing.value = false;
        
        // 更新JRXML
        updateJRXML();
        
        // 移除事件监听器
        if (cachedMouseMoveHandler) {
          document.removeEventListener('mousemove', cachedMouseMoveHandler);
        }
        if (cachedMouseUpHandler) {
          document.removeEventListener('mouseup', cachedMouseUpHandler);
          cachedMouseUpHandler = null;
        }
      };
    }
    
    // 添加事件监听器
    document.addEventListener('mousemove', cachedMouseMoveHandler);
    document.addEventListener('mouseup', cachedMouseUpHandler);
    
    // 立即触发一次mousemove事件，确保元素能够立即跟随鼠标
    // 这解决了在按下鼠标键100毫秒内移动鼠标，元素没有立即跟上鼠标位置的问题
    setTimeout(() => {
      if (cachedMouseMoveHandler) {
        cachedMouseMoveHandler(event);
      }
    }, 0);
  }
};



// 移除未使用的getBorderStyle函数

// 移除重复的updateBandHeight函数定义，使用下面的新版本

// 添加字段
// 移除未使用的字段管理函数

// 删除元素
const deleteElement = () => {
  if (selectedElement.value) {
    saveStateToHistory();
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
  saveToLocalStorageWrapper();
  updateJRXML();
};

// 取消编辑
const cancelEditing = () => {
  editingElement.value = null;
};

// fileUtils函数的包装函数
const saveToLocalStorageWrapper = () => {
  // 安全检查，确保reportProperties.value存在
  if (!reportProperties.value) {
    console.error('reportProperties.value未定义，无法保存到本地存储');
    return;
  }
  
  saveToLocalStorage(
    {
      reportProperties: reportProperties.value,
      bands: bands.value,
      reportFields: reportFields.value,
      jrxmlContent: jrxmlContent.value
    },
    reportProperties.value?.name || 'report'
  );
};

const loadFromLocalStorageWrapper = () => {
  const loadedData = loadFromLocalStorage(); 
  if (loadedData && loadedData.reportData) {
    reportProperties.value = loadedData.reportData.reportProperties;
    bands.value = loadedData.reportData.bands;
    reportFields.value = loadedData.reportData.reportFields;
    jrxmlContent.value = loadedData.reportData.jrxmlContent;
    // 更新selectedBandTypes以匹配加载的bands
    if (loadedData.reportData.bands && Array.isArray(loadedData.reportData.bands)) {
      selectedBandTypes.value = loadedData.reportData.bands.map((band: Band) => band.type);
    } else {
      selectedBandTypes.value = [];
    }
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
  const content = generateJRXMLContent(reportProperties.value, bands.value, reportFields.value, reportParameters.value);
  jrxmlContent.value = content;
  
  // 自动切换到JRXML标签页
  activeTab.value = 'jrxml';
  
  // 创建下载链接
  const blob = new Blob([content], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reportProperties.value?.name || 'report'}.jrxml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  // 保存数据
  saveToLocalStorageWrapper();
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

// 根据参数选择元素
const selectElementsByParameterWrapper = (paramName: string) => {
  selectElementsByParameter(bands.value, paramName, selectElement);
};

// 根据字段选择元素
const selectElementsByFieldWrapper = (fieldName: string) => {
  selectElementsByField(bands.value, fieldName, selectElement);
};
// 处理左侧面板大小变化
const handleLeftPanelSizeChange = (newSize: number) => {
  leftPanelWidth.value = newSize;
};

// 处理属性面板大小变化
const handlePropertyPanelSizeChange = (newSize: number) => {
  propertyPanelWidth.value = newSize;
};

// 处理底部面板大小变化
const handleBottomPanelSizeChange = (newSize: number) => {
  bottomPanelHeight.value = newSize;
};


// 自动更新JRXML内容
const updateJRXML = () => {
  try {
    console.log('开始更新JRXML内容...');
    
    // 确保所有数据都已初始化
    if (!reportProperties.value || !bands.value || !reportFields.value || !reportParameters.value) {
      console.log('数据未完全初始化，跳过JRXML更新');
      return;
    }
    
    console.log('当前reportProperties:', reportProperties.value);
    console.log('当前bands数量:', bands.value.length);
    console.log('当前reportFields数量:', reportFields.value.length);
    console.log('当前reportParameters数量:', reportParameters.value.length);
    
    const content = generateJRXMLContent(reportProperties.value, bands.value, reportFields.value, reportParameters.value);
    console.log('生成的JRXML内容长度:', content.length);
    console.log('生成的JRXML内容预览:', content.substring(0, 200) + '...');
    
    // 如果内容有变化，保存到历史记录
    if (content !== jrxmlContent.value) {
      console.log('JRXML内容已变化，更新中...');
      // 只在非拖拽/调整大小状态下保存历史
      if (!isDraggingOrResizing.value && historyStack.value.length === 0) {
        // 初始化时保存第一次状态
        saveStateToHistory();
      }
      jrxmlContent.value = content;
      console.log('JRXML内容已更新到响应式变量，新长度:', jrxmlContent.value.length);
      
      // 立即保存到本地存储，确保JRXML内容被保存
      saveToLocalStorageWrapper();
    } else {
      console.log('JRXML内容未变化');
    }
  } catch (error) {
    console.error('更新JRXML失败:', error);
  }
};

// 复制元素到剪贴板
const copyElement = async () => {
  if (selectedElement.value) {
    const { bandIndex, elementIndex } = selectedElement.value;
    const band = bands.value[bandIndex];
    if (band && band.elements && band.elements[elementIndex]) {
      try {
        // 深拷贝元素数据
        const elementData = JSON.parse(JSON.stringify(band.elements[elementIndex]));
        // 创建要复制的数据对象，包含元数据标记以便识别这是PDF设计器的元素
        const clipboardData = {
          type: 'PDF_DESIGNER_ELEMENT',
          version: '1.0',
          elementData: elementData
        };
        // 将数据转换为JSON字符串并写入剪贴板
        await navigator.clipboard.writeText(JSON.stringify(clipboardData));
        console.log('元素已复制到剪贴板:', elementData);
        // 可选：显示复制成功的提示
      } catch (err) {
        console.error('复制到剪贴板失败:', err);
        // 降级方案：使用旧的内存存储方式作为备用
        const elementData = JSON.parse(JSON.stringify(band.elements[elementIndex]));
        sessionStorage.setItem('pdfDesignerCopiedElement', JSON.stringify({
          type: 'PDF_DESIGNER_ELEMENT',
          version: '1.0',
          elementData: elementData
        }));
      }
    }
  }
};

// 从剪贴板粘贴元素
const pasteElement = async () => {
  try {
    // 首先尝试从剪贴板读取
    const clipboardText = await navigator.clipboard.readText();
    const clipboardData = JSON.parse(clipboardText);
    
    // 验证是否是我们的PDF设计器元素数据
    if (clipboardData.type === 'PDF_DESIGNER_ELEMENT' && clipboardData.elementData) {
      processPastedElement(clipboardData.elementData);
    }
  } catch (err) {
    console.error('从剪贴板读取失败:', err);
    // 降级方案：尝试从sessionStorage读取
    try {
      const savedData = sessionStorage.getItem('pdfDesignerCopiedElement');
      if (savedData) {
        const clipboardData = JSON.parse(savedData);
        if (clipboardData.type === 'PDF_DESIGNER_ELEMENT' && clipboardData.elementData) {
          processPastedElement(clipboardData.elementData);
        }
      }
    } catch (sessionErr) {
      console.error('从sessionStorage读取失败:', sessionErr);
    }
  }
};

// 处理粘贴的元素数据（抽取为单独函数以便重用）
const processPastedElement = (elementData: any) => {
  saveStateToHistory();
  
  // 确定粘贴位置（使用当前选中的区域或默认使用第一个可编辑区域）
  let targetBandIndex = selectedBandIndex.value !== null ? selectedBandIndex.value : 0;
  
  // 找到第一个包含elements数组的band
  if (targetBandIndex === null) {
    targetBandIndex = bands.value.findIndex(band => band.elements && Array.isArray(band.elements));
    // 如果没有找到，使用detail区域（通常索引为3）
    if (targetBandIndex === -1) {
      targetBandIndex = 3;
    }
  }
  
  const targetBand = bands.value[targetBandIndex];
  if (!targetBand) {
    console.error('目标区域不存在');
    return;
  }
  
  // 创建新元素（深拷贝）
  const newElement = JSON.parse(JSON.stringify(elementData));
  
  // 调整位置，避免与原元素重叠（向右下方移动一点）
  newElement.x += KEYBOARD_CONSTANTS.ELEMENT_PASTE_OFFSET;
  newElement.y += KEYBOARD_CONSTANTS.ELEMENT_PASTE_OFFSET;
  
  // 确保元素ID唯一
  if (newElement.id) {
    newElement.id = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // 添加到目标区域
  if (!targetBand.elements) {
    targetBand.elements = [];
  }
  
  targetBand.elements.push(newElement);
  
  // 选中新添加的元素
  const newElementIndex = targetBand.elements.length - 1;
  selectElement(targetBandIndex, newElementIndex);
  
  // 更新JRXML
  updateJRXML();
  
  console.log('元素已粘贴:', newElement);
};

// 在组件顶层定义handleKeyDown函数
const handleKeyDown = (event: KeyboardEvent) => {
  // 获取当前活动元素，用于判断焦点状态
  const activeEl = document.activeElement;
  const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
  const isTextareaFocused = activeEl && activeEl.tagName === 'TEXTAREA';
  
  // CTRL+0 重置缩放比例
  if (event.ctrlKey && event.key === '0') {
    event.preventDefault();
    resetZoom();
    return;
  }
  
  // CTRL+S 保存当前文件
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault();
    saveCurrentFileToStorage();
    return;
  }
  
  // CTRL+B 快捷键切换底部面板显示状态
  if (event.ctrlKey && event.key === 'b') {
    event.preventDefault();
    toggleBottomPanel();
    return;
  }
  
  // CTRL+Z 撤销操作
  if (event.ctrlKey && event.key === 'z') {
    event.preventDefault();
    undo();
    return;
  }
  
  // CTRL+Y 重做操作
  if (event.ctrlKey && event.key === 'y') {
    event.preventDefault();
    redo();
    return;
  }
  
  // CTRL+C 复制元素（只有在选中元素时才执行复制功能）
  if (event.ctrlKey && event.key === 'c' && selectedElement.value) {
    event.preventDefault();
    copyElement();
    return;
  }
  
  // CTRL+V 粘贴元素（只要设计区域有焦点且不在textarea中时才执行自定义粘贴功能）
  if (event.ctrlKey && event.key === 'v' && isDesignAreaFocused.value && !isTextareaFocused) {
    event.preventDefault();
    pasteElement();
    return;
  }
  
  // Del键删除选中的组件（仅在非编辑模式下且没有输入框处于焦点状态时）
  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElement.value && !editingElement.value && !isInputFocused) {
    event.preventDefault();
    deleteElement();
    return;
  }
  
  // 方向键选择周围组件
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    navigateElements(event.key);
    return;
  }
};

// 键盘导航选择周围组件
const navigateElements = (direction: string) => {
  if (!selectedElement.value) return;
  
  const { bandIndex: currentBandIndex, elementIndex: currentElementIndex } = selectedElement.value;
  const currentBand = bands.value[currentBandIndex];
  const currentElement = currentBand?.elements[currentElementIndex];
  
  if (!currentBand || !currentElement) return;
  
  let nearestElement: { bandIndex: number; elementIndex: number; distance: number } | null = null;
  let currentBandY = 0;
  
  // 计算当前元素的绝对位置
  const currentX = currentElement.x;
  const currentY = currentBandY + currentElement.y;
  
  // 遍历所有元素，找到最近的符合方向条件的元素
  bands.value.forEach((band, bandIdx) => {
    // 累计带的Y坐标
    const bandOffsetY = currentBandY;
    currentBandY += band.height;
    
    band.elements.forEach((element, elementIdx) => {
      // 跳过当前选中的元素
      if (bandIdx === currentBandIndex && elementIdx === currentElementIndex) return;
      
      // 计算元素的绝对位置
      const elementX = element.x;
      const elementY = bandOffsetY + element.y;
      
      // 根据方向计算是否符合条件
      let isValidDirection = false;
      
      switch (direction) {
        case 'ArrowUp':
          isValidDirection = elementY < currentY;
          break;
        case 'ArrowDown':
          isValidDirection = elementY > currentY;
          break;
        case 'ArrowLeft':
          isValidDirection = elementX < currentX;
          break;
        case 'ArrowRight':
          isValidDirection = elementX > currentX;
          break;
      }
      
      if (isValidDirection) {
        // 计算距离
        let distance = 0;
        switch (direction) {
          case 'ArrowUp':
          case 'ArrowDown':
            distance = Math.abs(elementY - currentY) + Math.abs(elementX - currentX) * KEYBOARD_CONSTANTS.SECONDARY_AXIS_WEIGHT; // Y方向为主，X方向为辅
            break;
          case 'ArrowLeft':
          case 'ArrowRight':
            distance = Math.abs(elementX - currentX) + Math.abs(elementY - currentY) * KEYBOARD_CONSTANTS.SECONDARY_AXIS_WEIGHT; // X方向为主，Y方向为辅
            break;
        }
        
        // 更新最近的元素
        if (!nearestElement || distance < nearestElement.distance) {
          nearestElement = { bandIndex: bandIdx, elementIndex: elementIdx, distance };
        }
      }
    });
  });
  
  // 选择最近的元素
  if (nearestElement) {
    // 使用类型断言确保属性访问有效
    const element = nearestElement as { bandIndex: number; elementIndex: number };
    selectElement(element.bandIndex, element.elementIndex);
  }
};

// 处理报表区域的点击事件，取消选中状态
const handlePaperClick = () => {
  // 只有在没有其他元素被点击的情况下才取消选中
  selectedElement.value = null;
  selectedBandIndex.value = null;
};

// 组件挂载时加载数据
onMounted(() => {
  console.log('组件挂载开始...');
  loadFromLocalStorageWrapper();
  console.log('本地数据加载完成');
  
  // 尝试加载最后编辑的文件
  try {
    const lastFileData = localStorage.getItem('pdfDesignerLastFile');
    if (lastFileData) {
      const lastFile = JSON.parse(lastFileData);
      console.log('找到最后编辑的文件:', lastFile.name);
      
      // 从文件列表中查找最后编辑的文件
      const storedFiles = localStorage.getItem('pdfDesignerFiles');
      if (storedFiles) {
        const files = JSON.parse(storedFiles);
        const lastFileInList = files.find((file: any) => file.id === lastFile.id);
        if (lastFileInList) {
          console.log('加载最后编辑的文件内容');
          loadFile(lastFileInList);
        }
      }
    }
  } catch (error) {
    console.error('加载最后编辑的文件失败:', error);
  }
  
  // 初始加载后更新JRXML，使用setTimeout确保所有数据都已加载
  setTimeout(() => {
    console.log('开始初始JRXML生成...');
    updateJRXML();
  }, 100);
  
  // 根据报表大小自动计算最佳缩放比例
  // 使用setTimeout确保DOM已经渲染完成
  setTimeout(() => {
    calculateOptimalZoom();
  }, UI_CONSTANTS.DOM_RENDER_DELAY);
  
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeyDown);
  
  // 添加鼠标滚轮事件监听，用于缩放功能
  const handleWheel = (event: Event) => {
    // 检查是否按下了Ctrl键
    const wheelEvent = event as WheelEvent;
    if (wheelEvent.ctrlKey || wheelEvent.metaKey) {
      // 阻止默认行为（页面缩放）
      wheelEvent.preventDefault();
      
      // 根据滚轮方向执行缩放
      if (wheelEvent.deltaY < 0) {
        // 向上滚动，放大
        zoomIn();
      } else {
        // 向下滚动，缩小
        zoomOut();
      }
    }
  };
  
  document.addEventListener('wheel', handleWheel, { passive: false });
  (window as any).pdfDesignerWheelListener = handleWheel;
  
  // 获取paper元素并添加点击事件监听
  const paperElement = document.querySelector('.paper');
  if (paperElement) {
    paperElement.addEventListener('click', () => {
      handlePaperClick();
      setDesignAreaFocused();
    });
  }
  
  // 保存监听器引用，以便在组件卸载时移除
  (window as any).pdfDesignerKeydownListener = handleKeyDown;
  (window as any).pdfDesignerPaperClickListener = handlePaperClick;
  (window as any).pdfDesignerSetFocused = setDesignAreaFocused;
  (window as any).pdfDesignerRemoveFocused = removeDesignAreaFocused;
});

// 组件卸载时清理事件监听器
onUnmounted(() => {
  // 移除键盘事件监听器
  const keydownListener = (window as any).pdfDesignerKeydownListener;
  if (keydownListener) {
    document.removeEventListener('keydown', keydownListener);
  }
  
  // 移除鼠标滚轮事件监听器
  const wheelListener = (window as any).pdfDesignerWheelListener;
  if (wheelListener) {
    document.removeEventListener('wheel', wheelListener);
  }
  
  // 移除paper点击事件监听器
  const handlePaperClick = (window as any).pdfDesignerPaperClickListener;
  const paperElement = document.querySelector('.paper');
  if (handlePaperClick && paperElement) {
    paperElement.removeEventListener('click', handlePaperClick);
  }
});

// 监听关键数据变化，自动保存和更新JRXML
watch(
  [reportProperties, bands, reportFields, reportParameters],
  () => {
    console.log('watch监听器被触发，isDraggingOrResizing:', isDraggingOrResizing.value);
    // 只在非拖拽/调整大小状态下更新
    if (!isDraggingOrResizing.value) {
      console.log('开始保存到本地存储和更新JRXML...');
      saveToLocalStorageWrapper();
      updateJRXML();
      // 更新超出边界的元素
      updateOutOfBoundsElements();
    } else {
      console.log('拖拽/调整大小中，跳过更新');
    }
  },
  { deep: true }
);

// 监听拖拽状态变化，在拖拽结束时更新超出边界的元素
watch(
  isDraggingOrResizing,
  (newValue, oldValue) => {
    // 当从拖拽状态变为非拖拽状态时，更新超出边界的元素
    if (oldValue === true && newValue === false) {
      updateOutOfBoundsElements();
    }
  }
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
      defaultFont: reportProperties.value?.defaultFont || {
        name: FONT_CONSTANTS.SANS_SERIF,
        size: REPORT_CONSTANTS.DEFAULT_FONT_SIZE,
        isBold: false,
        isItalic: false,
        isUnderline: false
      }
    };
    
    // 更新字段定义
    reportFields.value = parsedData.fields;
    
    // 更新参数定义
    reportParameters.value = parsedData.parameters || [];
    
    // 更新bands
    bands.value = parsedData.bands;
    
    // 更新选中的band类型
    selectedBandTypes.value = parsedData.bands.map(band => band.type);
    
    // 重新生成JRXML内容，确保参数被包含
    updateJRXML();
    
    // 为矩形元素添加默认边框，确保显示效果
    bands.value.forEach(band => {
      band.elements.forEach(element => {
        if (element.type === 'rectangle' && !element.border && (!element.box?.border && !element.box?.topBorder)) {
          if (!element.box) {
            element.box = {};
          }
          element.box.border = 'Thin';
          element.box.borderColor = '#000000';
        }
        
        // 确保所有元素大小合理
        if (element.width < ELEMENT_CONSTANTS.MIN_WIDTH) element.width = ELEMENT_CONSTANTS.MIN_WIDTH; // 确保最小宽度
        if (element.height < ELEMENT_CONSTANTS.MIN_HEIGHT) element.height = ELEMENT_CONSTANTS.MIN_HEIGHT; // 确保最小高度
        
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
          // 处理pen属性，但不使用不存在的borderStyle
          if (element.box.topPen) {
            // 可以将pen属性的值转换后赋给topBorder
            element.box.topBorder = processPen(element.box.topPen);
          }
          if (element.box.leftPen) {
            // 可以将pen属性的值转换后赋给leftBorder
            element.box.leftBorder = processPen(element.box.leftPen);
          }
          // 处理pen属性，但不使用不存在的borderStyle
          if (element.box.bottomPen) {
            // 可以将pen属性的值转换后赋给bottomBorder
            element.box.bottomBorder = processPen(element.box.bottomPen);
          }
          if (element.box.rightPen) {
            // 可以将pen属性的值转换后赋给rightBorder
            element.box.rightBorder = processPen(element.box.rightPen);
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
            // 使用类型断言来解决索引问题
            let borderColor = (element.box as any)?.[colorAttr] || '#000000';
            
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
          // 直接使用现有的border属性，不需要额外的borderStyle
          if (element.box.topBorder) {
            // 已经有topBorder属性，确保它的值正确
          }
          // 直接使用现有的border属性，不需要额外的borderStyle
          if (element.box.leftBorder) {
            // 已经有leftBorder属性，确保它的值正确
          }
          if (element.box.bottomBorder) {
            // 已经有bottomBorder属性，确保它的值正确
          }
          if (element.box.rightBorder) {
            // 已经有rightBorder属性，确保它的值正确
          }
          
          // 如果设置了全局border属性，应用到所有边
          if (element.box.border && (!element.box.topBorder || !element.box.leftBorder || !element.box.bottomBorder || !element.box.rightBorder)) {
            const globalBorder = applyBorder(element.box.border, 'borderColor');
            if (!element.box.topBorder) element.box.topBorder = globalBorder;
            if (!element.box.leftBorder) element.box.leftBorder = globalBorder;
            if (!element.box.bottomBorder) element.box.bottomBorder = globalBorder;
            if (!element.box.rightBorder) element.box.rightBorder = globalBorder;
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
      const additionalMargin = band.type === BAND_TYPE_CONSTANTS.DETAIL ? BAND_CONSTANTS.DETAIL_ADDITIONAL_MARGIN : BAND_CONSTANTS.DEFAULT_ADDITIONAL_MARGIN;
      band.height = Math.max(requiredHeight + additionalMargin, band.height, BAND_CONSTANTS.MIN_HEIGHT);
    });
    
    // 保存到本地存储
    saveToLocalStorageWrapper();
    
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
  if (!bands.value || !bands.value[bandIndex]) return;
  
  // 获取当前缩放比例
  const currentZoom = zoomLevel.value;
  const startHeight = bands.value[bandIndex].height;
  
  // 获取paper元素的位置信息，用于更准确的坐标计算
  const paperElement = document.querySelector('.paper') as HTMLElement;
  let paperOffsetY = 0;
  
  if (paperElement) {
    const paperRect = paperElement.getBoundingClientRect();
    // 考虑缩放比例的偏移量
    paperOffsetY = paperRect.top;
  }
  
  const handleMouseMove = (e: MouseEvent): void => {
    if (!bands.value || !bands.value[bandIndex]) return;
    // 考虑缩放比例计算高度变化，使用paperOffsetY来更准确地计算
    const deltaY = (e.clientY - paperOffsetY) / currentZoom - (startY - paperOffsetY) / currentZoom;
    const newHeight = Math.max(BAND_CONSTANTS.MIN_HEIGHT, startHeight + deltaY);
    bands.value[bandIndex].height = newHeight;
    
    // 调整该区域内元素的位置，确保元素不会超出区域边界
    const band = bands.value[bandIndex];
    if (band && band.elements) {
      band.elements.forEach(element => {
        // 考虑缩放比例的元素位置调整
        if ((element.y + element.height) * currentZoom > newHeight) {
          element.y = Math.max(0, (newHeight / currentZoom) - element.height);
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

// 获取指定Band的Y坐标偏移
const getBandOffsetY = (bandIndex: number): number => {
  let offset = 0;
  for (let i = 0; i < bandIndex; i++) {
    offset += bands.value[i]?.height || 0;
  }
  return offset;
};

// 开始调整元素大小
const startResizingElement = (event: MouseEvent, bandIndex: number, elementIndex: number): void => {
  event.preventDefault();
  
  // 自动隐藏底部面板
  showBottomPanel.value = false;
  
  const band = bands.value[bandIndex];
  const element = band?.elements[elementIndex];
  
  if (element) {
    // 获取当前缩放比例
    const currentZoom = zoomLevel.value;
    
    // 获取paper元素的位置信息，用于更准确的坐标计算
    const paperElement = document.querySelector('.paper') as HTMLElement;
    let paperOffsetX = 0;
    let paperOffsetY = 0;
    
    if (paperElement) {
      const paperRect = paperElement.getBoundingClientRect();
      // 考虑缩放比例的偏移量
      paperOffsetX = paperRect.left;
      paperOffsetY = paperRect.top;
    }
    
    resizingInfo.value = {
      bandIndex,
      elementIndex,
      startX: (event.clientX - paperOffsetX) / currentZoom,
      startY: (event.clientY - paperOffsetY) / currentZoom,
      startWidth: element.width,
      startHeight: element.height
    };
    
    isDraggingOrResizing.value = true;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingInfo.value) {
        const currentBand = bands.value[resizingInfo.value.bandIndex];
        const element = currentBand?.elements[resizingInfo.value.elementIndex];
        
        if (currentBand && element) {
          // 获取当前缩放比例
          const currentZoom = zoomLevel.value;
          
          // 获取paper元素的当前位置信息，用于更准确的坐标计算
          const paperEl = document.querySelector('.paper') as HTMLElement;
          let currentPaperOffsetX = 0;
          let currentPaperOffsetY = 0;
          
          if (paperEl) {
            const paperRect = paperEl.getBoundingClientRect();
            // 考虑缩放比例的偏移量
            currentPaperOffsetX = paperRect.left;
            currentPaperOffsetY = paperRect.top;
          }
          
          // 计算新的宽度和高度，考虑缩放比例
          let newWidth = resizingInfo.value.startWidth + ((e.clientX - currentPaperOffsetX) / currentZoom - resizingInfo.value.startX);
          let newHeight = resizingInfo.value.startHeight + ((e.clientY - currentPaperOffsetY) / currentZoom - resizingInfo.value.startY);
          
          // 限制最小尺寸
          newWidth = Math.max(20, newWidth);
          newHeight = Math.max(20, newHeight);
          
          // 获取报表边距设置
          // 注意：由于现在使用padding，元素坐标是相对于内容区域的
          const { leftMargin = 0, rightMargin = 0 } = reportProperties.value;
          // 限制不能超出纸张右边界（考虑右边距）和band底部边界
          // 修正计算：使用正确的缩放比例计算
          // 元素的x坐标是相对于内容区域的，所以最大宽度应该是页面宽度减去左右边距再减去元素的x坐标
          const maxElementWidth = paperWidth.value - leftMargin - rightMargin - element.x;
          const availableHeight = (currentBand.height - element.y);
          newWidth = Math.min(newWidth, maxElementWidth);
          newHeight = Math.min(newHeight, availableHeight);
          
          // 先应用基本的大小调整
          element.width = newWidth;
          element.height = newHeight;
          
          // 然后应用对齐线吸附功能（如果启用）
          if (enableSnapToAlignment.value) {
            // 创建临时元素对象用于检测对齐线
            const tempElement = { ...element, width: newWidth, height: newHeight };
            const snapInfo = detectAlignmentLines(tempElement, resizingInfo.value.bandIndex, true); // 更新对齐线状态
            
            // 应用水平吸附（调整宽度）- 只在接近对齐线时才吸附
            if (snapInfo.horizontal && Math.abs(snapInfo.horizontal.offset) < 3) {
              // 根据对齐线位置计算新的宽度
              // 注意：snapInfo.horizontal.position已经包含了leftMargin
              const targetPosition = snapInfo.horizontal.position - (reportProperties.value?.leftMargin || 0);
              
              // 判断是左边对齐还是右边对齐
              if (Math.abs(element.x - targetPosition) < 3) {
                // 左边对齐，保持x不变，调整宽度
                element.width = element.width + (element.x - targetPosition);
              } else if (Math.abs((element.x + newWidth) - targetPosition) < 3) {
                // 右边对齐，调整宽度
                element.width = targetPosition - element.x;
              } else if (Math.abs((element.x + newWidth/2) - targetPosition) < 3) {
                // 中心对齐，调整宽度
                element.width = (targetPosition - element.x) * 2;
              }
            }
            
            // 应用垂直吸附（调整高度）- 只在接近对齐线时才吸附
            if (snapInfo.vertical && Math.abs(snapInfo.vertical.offset) < 3) {
              // 根据对齐线位置计算新的高度
              // 注意：snapInfo.vertical.position已经包含了topMargin和band偏移
              const bandOffsetY = getBandOffsetY(resizingInfo.value.bandIndex);
              const targetPosition = snapInfo.vertical.position - (reportProperties.value?.topMargin || 0) - bandOffsetY;
              
              // 判断是顶部对齐还是底部对齐
              if (Math.abs(element.y - targetPosition) < 3) {
                // 顶部对齐，保持y不变，调整高度
                element.height = element.height + (element.y - targetPosition);
              } else if (Math.abs((element.y + newHeight) - targetPosition) < 3) {
                // 底部对齐，调整高度
                element.height = targetPosition - element.y;
              } else if (Math.abs((element.y + newHeight/2) - targetPosition) < 3) {
                // 中心对齐，调整高度
                element.height = (targetPosition - element.y) * 2;
              }
            }
          }
          
          // 使用最终尺寸再次检测对齐线（确保对齐线正确显示）
          if (enableSnapToAlignment.value) {
            detectAlignmentLines(element, resizingInfo.value.bandIndex);
          }
        }
      }
    };
    
    const handleMouseUp = () => {
      // 清除对齐线
      clearAlignmentLines();
      
      // 保存状态到历史记录
      saveStateToHistory();
      
      resizingInfo.value = null;
      isDraggingOrResizing.value = false;
      
      // 更新JRXML
      updateJRXML();
      
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

// 打赏相关
const showReward = ref(false);

const showRewardModal = () => {
  showReward.value = true;
};

const closeRewardModal = () => {
  showReward.value = false;
};

// 使用说明相关
const showHelp = ref(false);

const showHelpModal = () => {
  showHelp.value = true;
};

const closeHelpModal = () => {
  showHelp.value = false;
};

// 更新Band高度
const updateBandHeight = (index: number): void => {
  if (bands.value[index]) {
    // 确保高度不小于0
    bands.value[index].height = Math.max(0, bands.value[index].height);
    
    // 调整该区域内元素的位置，确保元素不会超出区域边界
    const band = bands.value[index];
    if (band && band.elements) {
      band.elements.forEach(element => {
        if (element.y + element.height > band.height) {
          element.y = Math.max(0, band.height - element.height);
        }
      });
    }
    
    // 保存状态到历史记录
    saveStateToHistory();
    
    // 更新JRXML
    updateJRXML();
  }
};

// 处理Band选择变化
const handleBandSelectionChange = (): void => {
  // 获取当前选中的band类型
  const currentSelectedTypes = [...selectedBandTypes.value] as BandType[];
  
  // 获取当前bands中的类型
  const currentBandTypes = bands.value.map(band => band.type);
  
  // 找出需要添加的band（在selectedBandTypes中但不在currentBandTypes中）
  const bandsToAdd = currentSelectedTypes.filter(type => !currentBandTypes.includes(type));
  
  // 找出需要移除的band（在currentBandTypes中但不在selectedBandTypes中）
  const bandsToRemove = currentBandTypes.filter(type => !currentSelectedTypes.includes(type));
  
  // 移除不需要的band
  if (bandsToRemove.length > 0) {
    bands.value = bands.value.filter(band => !bandsToRemove.includes(band.type));
  }
  
  // 添加新的band
  if (bandsToAdd.length > 0) {
    const newBands = bandsToAdd.map(type => {
      const bandTypeConfig = allBandTypes.find(bt => bt.type === type);
      return {
        type: type as BandType,
        height: bandTypeConfig ? bandTypeConfig.defaultHeight : 50,
        elements: []
      };
    });
    
    // 按照allBandTypes的顺序插入新band
    allBandTypes.forEach(bandType => {
      if (bandsToAdd.includes(bandType.type as BandType)) {
        const newBand = newBands.find(b => b.type === bandType.type);
        if (newBand) {
          // 确保height属性不为undefined
          if (newBand.height === undefined) {
            newBand.height = BAND_HEIGHT_CONSTANTS[bandType.type] || 50;
          }
          // 找到合适的插入位置
          let insertIndex = bands.value.length;
          for (let i = 0; i < bands.value.length; i++) {
            const currentBandTypeIndex = allBandTypes.findIndex(bt => bt.type === bands.value[i]?.type);
            const newBandTypeIndex = allBandTypes.findIndex(bt => bt.type === bandType.type);
            if (newBandTypeIndex < currentBandTypeIndex) {
              insertIndex = i;
              break;
            }
          }
          // 使用类型断言确保newBand符合Band接口
          bands.value.splice(insertIndex, 0, newBand as Band);
        }
      }
    });
  }
  
  // 保存状态到历史记录
  saveStateToHistory();
  
  // 更新JRXML
  updateJRXML();
};
</script>

<style scoped>
/* CSS变量定义 */
:root {
  --primary-color: #1890ff;
  --primary-hover: #40a9ff;
  --text-color: #333;
  --border-color: #ddd;
  --hover-color: #f0f0f0;
  --font-size-medium: 14px;
}

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
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
  height: 60px;
  flex-shrink: 0;
}

.designer-header h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.designer-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

/* 面板切换时的过渡样式 */
.element-panel {
  transition: width 0.3s ease;
  overflow: hidden;
}

.property-panel {
  overflow: hidden;
}

/* 当左右面板隐藏时，中间设计区域扩展 */
/* 打赏弹窗样式 */
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


/* 使用说明弹窗样式 */
.help-modal {
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

.help-content {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.help-content-scroll {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
}

.help-content h3 {
  margin-top: 10px;
  color: #333;
  text-align: center;
}

.help-content h4 {
  margin-top: 20px;
  margin-bottom: 10px;
  color: #444;
}

.help-content p {
  color: #666;
  margin-bottom: 10px;
  line-height: 1.6;
}

.help-content ol,
.help-content ul {
  color: #666;
  margin-bottom: 15px;
  padding-left: 25px;
}

.help-content li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.help-content strong {
  color: #333;
}

/* 底部面板的过渡样式 */
.tabs-container {
  overflow: hidden;
  border-top: 1px solid #ddd;
  background-color: #f5f5f5;
  position: relative;
  min-height: 0; /* 允许底部面板高度调整时不会影响整体布局 */
}

/* 标尺样式 */
.top-ruler-container {
  display: flex;
  height: 40px; /* 保持固定高度以容纳标签 */
  margin-bottom: 0;
  position: relative;
  width: 100%; /* 占满整个宽度 */
}

.corner-space {
  width: 40px; /* 保持固定宽度以匹配垂直标尺的标签 */
  height: 40px;
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  border-right: none;
  border-bottom: none;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.corner-space .unit-label {
  font-size: 10px;
  font-weight: bold;
  color: #666;
  text-transform: uppercase;
}

.horizontal-ruler {
  flex: 1;
  height: 40px; /* 保持固定高度 */
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  border-bottom: none;
  position: relative;
  overflow-x: auto; /* 允许水平滚动 */
  overflow-y: hidden; /* 禁止垂直滚动 */
  width: 100%; /* 确保占满剩余宽度 */
  min-width: 0; /* 允许flex子项收缩 */
  /* 隐藏滚动条但保留滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* 隐藏Chrome, Safari和Opera的滚动条 */
.horizontal-ruler::-webkit-scrollbar {
  display: none;
}

.horizontal-ruler .tick {
  position: absolute;
  top: 20px; /* 调整刻度位置到中间 */
  width: 1px;
  background-color: #999;
  transform-origin: top center;
}

.horizontal-ruler .tick.major {
  height: 35px; /* 增加主刻度线长度，占满标尺高度 */
  background-color: #333;
}

.horizontal-ruler .tick.minor {
  height: 25px; /* 增加次刻度线长度，接近标尺底部 */
}

.horizontal-ruler .label {
  position: absolute;
  top: 5px; /* 将标签移到标尺上方（外侧） */
  font-size: 10px;
  color: #333;
  transform: translateX(-50%);
}

.main-content {
  display: flex;
  flex: 1;
  position: relative;
  height: 100%; /* 确保占满整个高度 */
  min-height: 0; /* 允许flex子项收缩 */
}

.vertical-ruler-container {
  width: 40px; /* 保持固定宽度以容纳外侧的标签 */
  position: relative;
  height: 100%; /* 占满整个高度 */
  min-height: 0; /* 允许flex子项收缩 */
}

.vertical-ruler {
  width: 40px; /* 保持固定宽度 */
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  border-right: none;
  position: relative;
  overflow-x: hidden; /* 禁止水平滚动 */
  overflow-y: auto; /* 允许垂直滚动 */
  height: 100%; /* 确保占满整个高度 */
  min-height: 0; /* 允许flex子项收缩 */
  /* 隐藏滚动条但保留滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* 隐藏Chrome, Safari和Opera的滚动条 */
.vertical-ruler::-webkit-scrollbar {
  display: none;
}

.vertical-ruler .tick {
  position: absolute;
  left: 20px; /* 调整刻度位置到中间 */
  height: 1px;
  background-color: #999;
  transform-origin: left center;
}

.vertical-ruler .tick.major {
  width: 35px; /* 增加主刻度线长度，占满标尺宽度 */
  background-color: #333;
}

.vertical-ruler .tick.minor {
  width: 25px; /* 增加次刻度线长度，接近标尺右侧 */
}

.vertical-ruler .label {
  position: absolute;
  left: 5px; /* 将标签移到标尺左侧（外侧） */
  font-size: 10px;
  color: #333;
  transform: translateY(-50%);
}

.paper-container {
  flex: 1;
  position: relative;
  overflow: auto;
  display: flex;
  justify-content: flex-start; /* 修改为左对齐 */
  align-items: flex-start;
  padding: 0; /* 移除内边距，确保坐标匹配 */
}

/* 底部面板调整手柄 */
.tabs-resize-handle {
  position: relative;
  height: 4px;
  cursor: ns-resize;
  background-color: transparent;
  z-index: 10;
  flex-shrink: 0; /* 确保调整手柄不会被压缩 */
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
  /* 移除固定宽度，使用动态宽度 */
  padding: 1rem;
  background-color: #f8f9fa;
  border-right: 1px solid #ddd;
  overflow-y: auto;
  position: relative; /* 为调整手柄提供定位上下文 */
}

/* 左侧面板内容容器 */
.left-panel-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.element-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-shrink: 0;
}

/* 左侧面板调整手柄 */
.left-panel-resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: ew-resize;
  background-color: transparent;
  z-index: 10;
}

.left-panel-resize-handle:hover {
  background-color: rgba(25, 118, 210, 0.1);
}

.left-panel-resize-handle::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 30px;
  background-color: #1976d2;
  opacity: 0;
}

.left-panel-resize-handle:hover::before {
  opacity: 1;
}

.element-item {
  padding: 0.5rem;
  margin: 0.25rem;
  background-color: #e6f3ff; /* 浅蓝色背景 */
  border: 1px solid #b3d9ff; /* 蓝色边框 */
  border-radius: 4px;
  cursor: grab;
  text-align: left; /* 修改文本对齐为左对齐 */
  display: flex;
  align-items: center;
  justify-content: flex-start; /* 修改为左对齐 */
  gap: 0.5rem;
  width: calc(50% - 0.5rem); /* 两列布局，减去边距 */
  box-sizing: border-box;
}

.element-item:hover {
  background-color: #cce7ff; /* 悬停时更深的蓝色 */
  border-color: #80c0ff; /* 悬停时更深的边框 */
}

.element-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background-color: #f0f8ff; /* 更浅的蓝色背景 */
  border-radius: 3px;
  font-size: 12px;
  font-weight: bold;
  color: #1890ff;
  flex-shrink: 0;
}

.paper {
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05);
  position: relative;
  overflow: visible;
  border-radius: 2px;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
  transform-origin: center top;
}

.paper.focused {
  box-shadow: 0 6px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.1);
}

.paper:hover {
  box-shadow: 0 6px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.08);
}

.band {
  background-color: #fff;
  border-bottom: 1px dashed #ccc;
  position: relative;
  min-height: 20px;
}

.band.dragging-target {
  background-color: #e6f7ff;
  border-color: #1890ff;
}

.band.drag-over {
  background-color: #e6f7ff;
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
  background-color: transparent;
  font-size: 0.8rem;
  font-weight: bold;
  color: #666;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
}

.band-content {
  position: relative;
  width: 100%;
  height: 100%;
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
  position: relative;
}

/* 属性面板调整手柄 */
.property-panel-resize-handle {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: ew-resize;
  background-color: transparent;
  z-index: 10;
}

.property-panel-resize-handle:hover {
  background-color: rgba(25, 118, 210, 0.1);
}

.property-panel-resize-handle::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 30px;
  background-color: #1976d2;
  opacity: 0;
}

.property-panel-resize-handle:hover::before {
  opacity: 1;
}

.property-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.form-group {
    margin-bottom: 0.75rem;
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
    grid-template-columns: repeat(4, 1fr);
    gap: 0.3rem;
  }
  
  .margin-inputs input {
    padding: 0.3rem;
    font-size: 0.85rem;
    text-align: center;
  }

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 0.3rem 0.8rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
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
  
  /* Band高度设置部分样式 */
  .band-settings-section {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #e0e0e0;
  }
  
  .band-heights-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-top: 0.5rem;
  }
  
  .band-height-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .band-height-item label {
    font-size: 0.85rem;
    font-weight: bold;
    color: #333;
  }
  
  .band-height-control {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  .band-height-unit {
    font-size: 0.8rem;
    color: #666;
  }
  
  .band-height-hint {
    font-size: 0.75rem;
    color: #888;
    margin-top: 0.25rem;
  }
  
  /* 右侧面板中的 band 高度设置样式 */
  .property-section .band-heights-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }
  
  .property-section .band-height-item {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  
  .property-section .band-height-item label {
    margin-bottom: 0;
    flex: 1;
  }
  
  .property-section .band-height-control {
    flex: 0 0 auto;
  }
  
  /* Band选择样式 */
  .band-selection-section {
    grid-column: span 1;
  }
  
  .band-selection-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  
  .band-selection-item {
    display: flex;
    align-items: center;
  }
  
  .band-selection-item label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    cursor: pointer;
    margin-bottom: 0;
  }
  
  .band-selection-item input[type="checkbox"] {
    margin: 0;
  }
  
  .band-selection-note {
    margin-top: 0.75rem;
    padding-top: 0.5rem;
    border-top: 1px dashed #e0e0e0;
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
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 70vh; /* 限制最大高度，避免占用过多屏幕空间 */
}

.tab-navigation {
  display: flex;
  background-color: #e9e9e9;
  border-bottom: 1px solid #ddd;
  padding: 0 10px;
  flex-shrink: 0; /* 确保导航栏不会被压缩 */
  position: sticky;
  top: 0;
  z-index: 10;
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
  flex: 1;
  overflow: auto;
  min-height: 0; /* 确保flex子元素可以收缩 */
  padding: 15px;
  box-sizing: border-box;
}

.jrxml-tab {
  background-color: white;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-settings-tab {
    background-color: white;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding: 15px;
}

  .settings-section {
    background-color: #f9f9f9;
    border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_MEDIUM + "px"');
    padding: v-bind('UI_CONSTANTS.PANEL_PADDING + "px"');
    border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #e8e8e8;
  }

  .settings-section h4 {
    margin-top: 0;
    margin-bottom: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
    color: #333;
    font-size: v-bind('UI_CONSTANTS.FONT_SIZE_MEDIUM + "px"');
    font-weight: 600;
    border-bottom: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #e0e0e0;
    padding-bottom: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"');
  }

  /* 表单行布局 */
  .form-row {
    display: flex;
    gap: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
    margin-bottom: 0.75rem;
  }

  .flex-1 {
    flex: 1;
  }

  /* 紧凑字体设置样式 */
  .font-settings-compact {
    grid-column: span 1;
  }

  .font-settings-row {
    display: flex;
    gap: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
    margin-bottom: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  }

  .font-setting-item {
    flex: 1;
  }

  .font-setting-item select,
  .font-setting-item input {
    width: 100%;
    padding: v-bind('UI_CONSTANTS.INPUT_PADDING_SMALL');
    border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #ddd;
    border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
    font-size: v-bind('UI_CONSTANTS.FONT_SIZE_SMALL + "px"');
  }

  .font-style-options {
    display: flex;
    gap: v-bind('UI_CONSTANTS.MEDIUM_GAP + "px"');
    flex-wrap: wrap;
  }

  .font-style-options label {
    display: flex;
    align-items: center;
    gap: v-bind('UI_CONSTANTS.SMALL_GAP + "px"');
    margin-bottom: 0;
    font-weight: normal;
    font-size: v-bind('UI_CONSTANTS.FONT_SIZE_SMALL + "px"');
  }

  /* 紧凑Band设置样式 */
  .band-settings-compact {
    grid-column: span 1;
  }

  .font-settings-section {
    grid-column: 1 / -1;
    padding: v-bind('UI_CONSTANTS.PANEL_PADDING + "px"');
    background-color: #f9f9f9;
    border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
    margin-top: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"');
  }

  .font-settings-section h4 {
    margin-top: 0;
    margin-bottom: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
    color: #333;
    font-size: v-bind('UI_CONSTANTS.FONT_SIZE_HEADER + "px"');
  }

.checkbox-group {
    display: flex;
    gap: v-bind('UI_CONSTANTS.MEDIUM_GAP + "px"');
    flex-wrap: wrap;
  }

  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: v-bind('UI_CONSTANTS.SMALL_GAP + "px"');
    margin-bottom: 0;
    font-weight: normal;
    font-size: v-bind('UI_CONSTANTS.FONT_SIZE_DEFAULT + "px"');
  }

.jrxml-tab {
  background-color: white;
}

.jrxml-container {
  background-color: #f5f5f5;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  min-height: 0;
}

.jrxml-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  background-color: #e9e9e9;
  border-bottom: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #ddd;
  flex-shrink: 0;
}

.jrxml-content {
  flex: 1;
  overflow: auto;
  min-height: 0;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #ddd;
}

.jrxml-pre {
  margin: 0;
  padding: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_DEFAULT + "px"');
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
  padding: v-bind('UI_CONSTANTS.PANEL_PADDING + "px"');
  background-color: #f8f9fa;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_SMALL + "px"');
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  border: none;
  outline: none;
  resize: none;
  tab-size: 2;
  box-sizing: border-box;
  /* 优化代码显示效果 */
  color: #333;
  text-shadow: 0 1px 0 rgba(255,255,255,.8);
  /* 增加行号效果的背景 */
  background-image: linear-gradient(transparent 19px, #eee 19px, #eee 20px, transparent 20px);
  background-size: 100% v-bind('UI_CONSTANTS.LINE_HEIGHT_PX + "px"');
  background-position: 0 1em;
}

.jrxml-editor:focus {
  border: none;
  outline: none;
}

.jrxml-actions {
  display: flex;
  gap: v-bind('UI_CONSTANTS.SMALL_GAP + "px"');
}

.jrxml-placeholder {
  padding: v-bind('UI_CONSTANTS.LARGE_MARGIN + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  text-align: center;
  color: #999;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 元素标签页样式 */
.element-tabs {
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #ddd;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  overflow: hidden;
}

.element-tab-navigation {
  display: flex;
  background-color: #f5f5f5;
  border-bottom: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #ddd;
}

.element-tab-button {
  padding: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  border: none;
  background: none;
  cursor: pointer;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_DEFAULT + "px"');
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
  border-bottom: v-bind('UI_CONSTANTS.BORDER_MEDIUM + "px"') solid #1890ff;
}

.element-tab-content {
  padding: v-bind('UI_CONSTANTS.PANEL_PADDING + "px"');
  min-height: v-bind('(UI_CONSTANTS.LARGE_MARGIN * 5) + "px"');
  overflow: auto;
}

/* 左侧报表参数区域样式 */
.data-parameters-section {
  margin-bottom: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  max-height: 200px;
}

.data-parameters-section h4 {
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_DEFAULT + "px"');
  margin-bottom: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  color: #666;
}

.parameters-mini-view {
  flex: 1;
  min-height: 150px;
  overflow-y: auto;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_TINY + "px"');
}

/* 左侧数据字段区域样式 */
.data-fields-section {
  margin-top: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  padding-top: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  border-top: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #e0e0e0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  max-height: 200px;
}

.data-fields-section h4 {
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_DEFAULT + "px"');
  margin-bottom: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  color: #666;
}

.fields-mini-view {
  flex: 1;
  min-height: 150px;
  overflow-y: auto;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_TINY + "px"');
}

.field-mini-item {
  padding: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  margin-bottom: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"');
  background-color: #f5f5f5;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  display: flex;
  flex-direction: column;
  gap: v-bind('UI_CONSTANTS.SMALL_GAP + "px"');
}

.field-name {
  color: #1890ff;
  font-weight: 500;
}

.field-type {
  color: #666;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_MINI + "px"');
}

/* Box设置相关样式 */
.box-section {
  margin-bottom: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  padding-bottom: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  border-bottom: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #eee;
}

.box-section:last-child {
  border-bottom: none;
}

.box-section h5 {
  margin-top: 0;
  margin-bottom: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_DEFAULT + "px"');
  color: #333;
  font-weight: 600;
}

.border-side-group {
  display: flex;
  align-items: center;
  margin-bottom: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  gap: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
}

.side-label {
  min-width: v-bind('(UI_CONSTANTS.MEDIUM_MARGIN * 2) + "px"');
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_DEFAULT + "px"');
}

.side-control {
  flex: 1;
  max-width: 200px;
}

.color-control {
  width: v-bind('(UI_CONSTANTS.MEDIUM_MARGIN * 2.5) + "px"');
  height: v-bind('(UI_CONSTANTS.MEDIUM_MARGIN * 2) + "px"');
  padding: v-bind('UI_CONSTANTS.SMALL_GAP + "px"');
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #d9d9d9;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  cursor: pointer;
}

.init-box-section {
  padding: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  text-align: center;
  background-color: #f9f9f9;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
}

.padding-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
}

/* 按钮样式 */
.btn-small {
  padding: 3px 8px;
  font-size: 12px;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #666;
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #d9d9d9;
  padding: 4px 8px;
  font-size: 12px;
}

.btn-secondary:hover {
  background-color: #e6e6e6;
  color: #333;
}

.btn-primary {
  background-color: #1890ff;
  color: white;
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #1890ff;
  padding: 4px 8px;
  font-size: 12px;
}

.btn-primary:hover {
  background-color: #40a9ff;
  border-color: #40a9ff;
}

.btn-danger {
  background-color: #ff4d4f;
  color: white;
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #ff4d4f;
}

.btn-danger:hover {
  background-color: #ff7875;
  border-color: #ff7875;
}

/* 缩放控制区域样式 */
.zoom-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: 8px;
}

/* 自动吸附开关样式 */
.snap-toggle {
  display: flex;
  align-items: center;
  margin-right: 8px;
  padding: 4px 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
}

.snap-toggle label {
  display: flex;
  align-items: center;
  font-size: 12px;
  cursor: pointer;
  margin: 0;
}

.snap-toggle input[type="checkbox"] {
  margin-right: 4px;
}

/* 缩放按钮样式 */
.btn-zoom {
  padding: 3px 6px;
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #d9d9d9;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  cursor: pointer;
  font-size: 12px;
  background-color: #f0f0f0;
  color: #666;
  min-width: 24px;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-zoom:hover {
  background-color: #e6e6e6;
  color: #333;
}

/* 缩放选择框样式 */
.zoom-select {
  padding: 3px 6px;
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #d9d9d9;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  background-color: white;
  font-size: 12px;
}

.element-actions {
  margin-top: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  text-align: right;
}

/* 对齐控制样式 */
.alignment-controls {
  display: flex;
  gap: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"');
  margin-top: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"');
}

.align-button {
  flex: 1;
  padding: v-bind('(UI_CONSTANTS.SMALL_MARGIN + 2) + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #d9d9d9;
  background: #fff;
  cursor: pointer;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  transition: all 0.2s;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_TINY + "px"');
}

.align-button:hover {
  background: #f0f0f0;
}

.align-button.active {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
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
  display: flex;
  justify-content: flex-end;
  padding: v-bind('(UI_CONSTANTS.SMALL_MARGIN + 2) + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  border-bottom: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #eee;
}

.jrxml-content {
  flex: 1;
  overflow: hidden;
  display: flex;
}



.jrxml-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_DEFAULT + "px"');
  background-color: #fafafa;
}


.selection-box {
  position: absolute;
  background-color: rgba(24, 144, 255, 0.2);
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #1890ff;
  pointer-events: none;
  z-index: 1000;
}

/* 选中元素高亮样式 */
.design-element.selected {
  box-shadow: 0 0 0 v-bind('UI_CONSTANTS.BORDER_MEDIUM + "px"') #1890ff;
  position: relative;
}

/* 选择动画效果 */
.design-element.select-animation {
  animation: pulse 0.3s ease-in-out;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 v-bind('UI_CONSTANTS.BORDER_MEDIUM + "px"') #1890ff;
  }
  50% {
    box-shadow: 0 0 0 v-bind('UI_CONSTANTS.BORDER_THICK + "px"') rgba(24, 144, 255, 0.5);
  }
  100% {
    box-shadow: 0 0 0 v-bind('UI_CONSTANTS.BORDER_MEDIUM + "px"') #1890ff;
  }
}

/* 提高鼠标选择的精确度 */
.design-element {
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
/* 文件管理相关样式 */
.current-file-name {
  margin: 0 v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  padding: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  background-color: #f0f0f0;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_SMALL + "px"');
  color: #666;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 报表边距容器样式 */
.pager {
  position: relative;
  width: 100%;
  height: 100%;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"'),
    rgba(200, 200, 200, 0.2) v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"'),
    rgba(200, 200, 200, 0.2) v-bind('(UI_CONSTANTS.MEDIUM_MARGIN * 2) + "px"')
  );
  background-size: v-bind('(UI_CONSTANTS.MEDIUM_MARGIN * 2) + "px"') v-bind('(UI_CONSTANTS.MEDIUM_MARGIN * 2) + "px"');
}

/* 坐标显示样式 */
.coordinates-display {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_TINY + "px"');
  pointer-events: none;
  z-index: 1000;
  white-space: nowrap;
}

/* 字体提示样式 */
.font-hint {
  display: block;
  margin-top: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"');
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_TINY + "px"');
  color: #666;
}

/* 报表元素列表样式 */
.report-elements-section {
  margin-bottom: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.report-elements-section h4 {
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_DEFAULT + "px"');
  margin-bottom: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"');
  color: #666;
}

.filter-input-container {
  position: relative;
  margin-bottom: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"');
}

.filter-input {
  width: 100%;
  padding: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #ddd;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_SMALL + "px"');
  outline: none;
  transition: border-color 0.2s;
}

.filter-input:focus {
  border-color: #1890ff;
}

.clear-filter-btn {
  position: absolute;
  right: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"');
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_DEFAULT + "px"');
  padding: 2px;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-filter-btn:hover {
  background-color: #f0f0f0;
  color: #666;
}

.report-elements-list {
  flex: 1;
  min-height: 200px;
  overflow-y: auto;
  border: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #e0e0e0;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_SMALL + "px"');
  background-color: #fafafa;
}

.band-group {
  margin-bottom: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"');
}

.band-group:last-child {
  margin-bottom: 0;
}

.band-group-header {
  padding: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  background-color: #e0e0e0;
  font-weight: 500;
  color: #333;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_SMALL + "px"');
  border-bottom: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #d0d0d0;
}

.report-element-item {
  padding: v-bind('UI_CONSTANTS.SMALL_MARGIN + "px"') v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"');
  border-bottom: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #e0e0e0;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: v-bind('UI_CONSTANTS.SMALL_GAP + "px"');
  justify-content: flex-start;
}

.report-element-item:last-child {
  border-bottom: none;
}

.report-element-item:hover {
  background-color: #f0f0f0;
}

.report-element-item.selected {
  background-color: #e6f7ff;
  border-color: #1890ff;
}

.element-type-info {
  display: flex;
  align-items: center;
  gap: v-bind('UI_CONSTANTS.SMALL_GAP + "px"');
  flex: 1;
}

.element-type-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border-radius: 3px;
  color: #1890ff;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_SMALL + "px"');
  font-weight: bold;
  flex-shrink: 0;
}

.element-type-name {
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.element-content-preview {
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_TINY + "px"');
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
  flex-shrink: 0;
}

.element-band-info {
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_MINI + "px"');
  color: #999;
  display: flex;
  align-items: center;
  gap: v-bind('UI_CONSTANTS.SMALL_GAP + "px"');
  flex-shrink: 0;
}

.band-tag {
  background-color: #f0f0f0;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_MINI + "px"');
}

/* 文件管理弹窗样式 */
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

.file-manager-modal {
  background-color: white;
  border-radius: v-bind('UI_CONSTANTS.BORDER_RADIUS_MEDIUM + "px"');
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: v-bind('UI_CONSTANTS.MEDIUM_MARGIN + "px"') v-bind('UI_CONSTANTS.LARGE_MARGIN + "px"');
  border-bottom: v-bind('UI_CONSTANTS.BORDER_THIN + "px"') solid #e0e0e0;
  background-color: #fafafa;
}

.modal-header h3 {
  margin: 0;
  font-size: v-bind('UI_CONSTANTS.FONT_SIZE_HEADER + "px"');
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.btn-close:hover {
  background-color: #f0f0f0;
  color: #666;
}

.modal-body {
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

/* 文件菜单样式 */
.file-menu-container {
  position: relative;
  display: inline-block;
}

.file-menu-button {
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: background-color 0.2s;
}

.file-menu-button:hover {
  background-color: #40a9ff;
}

.file-menu-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 180px;
  margin-top: 4px;
}

.menu-item {
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #333;
  font-size: 14px;
}

.menu-item:hover {
  background-color: #f0f0f0;
}

.menu-item i {
  width: 16px;
  text-align: center;
  color: #1890ff;
}

.menu-divider {
  height: 1px;
  background-color: #ddd;
  margin: 4px 0;
}

/* 文件列表二级菜单样式 */
.file-submenu-container {
  position: relative;
}

.submenu-arrow {
  margin-left: auto;
  font-size: 12px;
  transition: transform 0.2s;
}

.file-submenu-container:hover .submenu-arrow {
  transform: rotate(90deg);
}

.file-submenu {
  position: absolute;
  top: 0;
  left: 100%;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  width: 300px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.submenu-header {
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.submenu-header h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
}

.file-filter {
  display: flex;
  align-items: center;
}

.filter-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 12px;
}

.clear-filter-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
  margin-left: 4px;
  font-size: 12px;
}

.clear-filter-btn:hover {
  color: #666;
}

.submenu-file-list {
  flex: 1;
  overflow-y: auto;
  padding: 5px 0;
}

.submenu-file-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.submenu-file-item:hover {
  background-color: #f5f5f5;
}

.submenu-file-item.active {
  background-color: #e6f7ff;
  border-left: 3px solid #1890ff;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  display: block;
  font-size: 13px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-date {
  display: block;
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.file-item-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

.btn-danger:hover {
  color: #ff4d4f;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: #999;
}

.empty-state p {
  margin: 0 0 10px 0;
}

.submenu-footer {
  padding: 8px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
}

/* 文件列表弹窗样式 */
.file-list-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  z-index: 1001;
  width: 800px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>