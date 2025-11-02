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
        
        <!-- 缩放控制 -->
        <div class="zoom-controls">
          <button @click="zoomOut" class="btn-zoom" title="缩小">-</button>
          <select v-model="zoomLevel" @change="applyZoom" class="zoom-select">
            <option value="0.25">25%</option>
            <option value="0.5">50%</option>
            <option value="0.75">75%</option>
            <option value="1">100%</option>
            <option value="1.25">125%</option>
            <option value="1.5">150%</option>
            <option value="2">200%</option>
          </select>
          <button @click="zoomIn" class="btn-zoom" title="放大">+</button>
          <button @click="resetZoom" class="btn-zoom" title="重置缩放">100%</button>
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
        {{ dragCoordinates.bandName }}X: {{ dragCoordinates.x }}, Y: {{ dragCoordinates.y }}
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
        
        <!-- 报表参数区域 -->
        <div class="data-parameters-section">
          <h4>报表参数</h4>
          <div class="parameters-mini-view">
            <div v-for="(param, index) in reportParameters" :key="index" class="field-mini-item">
              <span class="field-name">$P{ {{ param.name }} }</span>
              <span class="field-type">({{ param.class }})</span>
            </div>
          </div>
        </div>
        
        <!-- 数据字段区域 -->
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
      <div class="designer-canvas" @click="setDesignAreaFocused">
        <!-- 顶部标尺容器 -->
        <div class="top-ruler-container">
          <!-- 左上角空白区域 -->
          <div class="corner-space">
          <div class="unit-label">mm</div>
        </div>
          <!-- 水平标尺 -->
          <div class="horizontal-ruler" :style="{ width: paperWidth + 'px' }">
            <div 
              v-for="tick in horizontalRulerTicks" 
              :key="tick.position" 
              class="tick" 
              :class="{ 'major': tick.major, 'minor': !tick.major }"
              :style="{ left: tick.position + 'px' }"
            ></div>
            <div 
              v-for="label in horizontalRulerLabels" 
              :key="label.position" 
              class="label" 
              :style="{ left: label.position + 'px' }"
            >
              {{ label.value }}
            </div>
          </div>
        </div>
        
        <!-- 左侧标尺和纸张容器 -->
        <div class="main-content">
          <!-- 垂直标尺 -->
          <div class="vertical-ruler-container">
            <div class="vertical-ruler" >
              <div 
                v-for="tick in verticalRulerTicks" 
                :key="tick.position" 
                class="tick" 
                :class="{ 'major': tick.major, 'minor': !tick.major }"
                :style="{ top: tick.position + 'px' }"
              ></div>
              <div 
                v-for="label in verticalRulerLabels" 
                :key="label.position" 
                class="label" 
                :style="{ top: label.position + 'px' }"
              >
                {{ label.value }}
              </div>
            </div>
          </div>
          
          <!-- 纸张容器 -->
          <div class="paper-container">
            <!-- 纸张 -->
            <div class="paper" 
                 :style="{ 
                   width: paperWidth + 'px', 
                   height: paperHeight + 'px',
                   transform: `scale(${zoomLevel})`,
                   transformOrigin: 'top left'
                 }"
                 :class="{'focused': isDesignAreaFocused}"
                 @drop="handleDrop"
                 @dragover.prevent
                 @dragenter.prevent
            >
            <!-- 报表边距容器 -->
            <div class="pager"
                 :style="{ 
                   padding: reportProperties.topMargin + 'px ' + reportProperties.rightMargin + 'px ' + reportProperties.bottomMargin + 'px ' + reportProperties.leftMargin + 'px',
                   width: '100%',
                   height: '100%',
                   position: 'relative',
                   backgroundSize: '20px 20px'
                 }"
            >
            
            <!-- 报表区域 -->
            <div 
              v-for="(band, bandIndex) in bands" 
              :key="band.type"
              class="band"
              :style="{ height: band.height + 'px' }"
              @click="selectBand(bandIndex)"
              :class="{ 
                'selected': selectedBandIndex === bandIndex,
                'dragging-target': highlightedBandIndex === bandIndex
              }"
            >
              <div class="band-header">
                <span>{{ band.type }}</span>
              </div>
              <div class="band-content">
                <ElementFactory
                  v-for="(item, index) in band.elements"
                  :key="index"
                  :element="item"
                  :band-index="bandIndex"
                  :element-index="index"
                  :selected-element="selectedElement"
                  :editing-element="editingElement"
                  :report-font-family="reportProperties.defaultFont.name"
                  :report-font-size="reportProperties.defaultFont.size"
                  :report-is-bold="reportProperties.defaultFont.isBold"
                  :report-is-italic="reportProperties.defaultFont.isItalic"
                  :report-is-underline="reportProperties.defaultFont.isUnderline"
                  @select="selectElement"
                  @drag-start="startDragging"
                  @resize-start="startResizingElement"
                  @start-editing="startEditing"
                  @finish-editing="finishEditing"
                  @cancel-editing="cancelEditing"
                />
              </div>
              <!-- 区域高度调整手柄 -->
              <div class="band-resize-handle" @mousedown.stop="startResizingBand($event, bandIndex)"></div>
            </div></div>
          </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧属性面板 -->
      <div class="property-panel" v-show="showRightPanel" :style="{ width: propertyPanelWidth + 'px' }">
        <!-- 左侧调整手柄 -->
        <div class="property-panel-resize-handle" @mousedown.stop="startResizingPropertyPanel"></div>
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
                  <input v-model="currentElement.fieldName" type="text" @input="updateExpressionFromFieldName" />
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
                  <select v-model="currentElement.fontFamily" style="appearance: none; -webkit-appearance: none;">
                    <option value="">使用默认字体</option>
                    <option value="SansSerif">SansSerif</option>
                    <option value="Serif">Serif</option>
                    <option value="Monospaced">Monospaced</option>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Noto Serif SC">Noto Serif SC</option>
                  </select>
                  <small style="display: block; margin-top: 4px; font-size: 12px; color: #666;">提示：可以直接在下拉框中输入字体名称</small>
                </div>
                
                <div class="form-group">
                  <label>文本对齐</label>
                  <div class="alignment-controls">
                    <button 
                      v-for="align in ['Left', 'Center', 'Right']" 
                      :key="align"
                      @click="setHorizontalAlignment(align as 'Left' | 'Center' | 'Right')"
                      :class="{ active: currentElement.textAlignment === align }"
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
                      :class="{ active: currentElement.verticalAlignment === align }"
                      class="align-button"
                      title="垂直对齐: {{ align }}"
                    >
                      {{ align === 'Top' ? '顶部对齐' : align === 'Middle' ? '垂直居中' : '底部对齐' }}
                    </button>
                  </div>
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

          <!-- Band高度设置 -->
          <div class="settings-section band-settings-compact">
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
    </div>
    
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
import ElementFactory from './elements/ElementFactory.vue';
import type { DesignElement, Band, ReportField, ReportParameter, BandType } from '../types';
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

// 确保浏览器环境中DOMParser可用
// 移除未使用的getDOMParser函数
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

// 缩放相关状态
const zoomLevel = ref(1); // 默认缩放级别为100%

// 缩放控制方法
function zoomIn() {
  // 预设的缩放级别
  const zoomLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
  
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
  const zoomLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
  
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
  zoomLevel.value = 1;
  applyZoom();
}

function applyZoom() {
  // 这里不需要额外操作，因为zoomLevel是响应式的，会自动更新视图
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
const bottomPanelHeight = ref(400); // 默认高度400px

// 属性面板宽度
const propertyPanelWidth = ref(300); // 默认宽度300px

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
  { type: 'line', name: '线条' }
]);

// 定义元素接口
// 使用从types/index.ts导入的Pen和Box接口

// 使用从types/index.ts导入的接口

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

// 所有可能的band类型
const allBandTypes = [
  { type: 'title', name: '标题', defaultHeight: 80 },
  { type: 'pageHeader', name: '页眉', defaultHeight: 50 },
  { type: 'columnHeader', name: '列标题', defaultHeight: 30 },
  { type: 'detail', name: '详细数据', defaultHeight: 100 },
  { type: 'columnFooter', name: '列脚', defaultHeight: 30 },
  { type: 'pageFooter', name: '页脚', defaultHeight: 40 },
  { type: 'summary', name: '汇总', defaultHeight: 60 },
  { type: 'background', name: '背景', defaultHeight: 0 },
  { type: 'lastPageFooter', name: '末页页脚', defaultHeight: 40 },
  { type: 'noData', name: '无数据', defaultHeight: 50 }
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

const historyStack = ref<HistoryState[]>([]);
const redoStack = ref<HistoryState[]>([]);
const MAX_HISTORY_SIZE = 50; // 最大历史记录数量
let isDraggingOrResizing = false; // 标记是否正在拖动或调整大小

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

// 标尺相关计算属性
const horizontalRulerTicks = computed(() => {
  const ticks = [];
  const width = paperWidth.value;
  const unit = 5; // 减小基本单位，从10px改为5px，增加刻度密度
  
  for (let i = 0; i <= width; i += unit) {
    ticks.push({
      position: i * zoomLevel.value, // 应用缩放比例
      major: i % 25 === 0 // 每25px一个主要刻度，从50px改为25px
    });
  }
  
  return ticks;
});

const horizontalRulerLabels = computed(() => {
  const labels = [];
  const width = paperWidth.value;
  
  for (let i = 0; i <= width; i += 25) { // 每25px显示一个标签，从50px改为25px
    labels.push({
      position: i * zoomLevel.value, // 应用缩放比例
      value: i.toString()
    });
  }
  
  return labels;
});

const verticalRulerTicks = computed(() => {
  const ticks = [];
  const height = paperHeight.value;
  const unit = 5; // 减小基本单位，从10px改为5px，增加刻度密度
  
  for (let i = 0; i <= height; i += unit) {
    ticks.push({
      position: i * zoomLevel.value, // 应用缩放比例
      major: i % 25 === 0 // 每25px一个主要刻度，从50px改为25px
    });
  }
  
  return ticks;
});

const verticalRulerLabels = computed(() => {
  const labels = [];
  const height = paperHeight.value;
  
  for (let i = 0; i <= height; i += 25) { // 每25px显示一个标签，从50px改为25px
    labels.push({
      position: i * zoomLevel.value, // 应用缩放比例
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
      x: Math.max(0, x - 50), // 减去元素宽度的一半以居中
      y: Math.max(0, y - currentY), // 直接使用相对于band的位置
      width: 100,
      height: 30,
      ...getDefaultElementProperties(elementData.type)
    };
    
    const targetBand = bands.value[bandIndex];
    if (targetBand && targetBand.elements) {
      // 确保元素不会超出边距限制
      // 注意：由于现在使用padding，元素坐标是相对于内容区域的
      const availableWidth = paperWidth.value - reportProperties.value.leftMargin - reportProperties.value.rightMargin;
      
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
  // 快速更新选中状态，避免不必要的DOM操作
  selectedElement.value = { bandIndex, elementIndex };
  selectedBandIndex.value = null;
  
  // 自动隐藏底部面板
  showBottomPanel.value = false;
  
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
  const element = band?.elements[elementIndex];
  
  if (element) {
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
      startX: ((event.clientX - paperOffsetX) / currentZoom) - element.x,
      startY: ((event.clientY - paperOffsetY) / currentZoom) - element.y
    };
    
    isDraggingOrResizing = true;
    
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
            const availableWidth = (paperWidth.value - reportProperties.value.leftMargin - reportProperties.value.rightMargin);
            
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
            const newX = Math.max(0, Math.min(((e.clientX - paperOffsetX) / currentZoom) - draggingInfo.value.startX, availableWidth - currentElement.width));
            const newY = ((e.clientY - paperOffsetY) / currentZoom) - draggingInfo.value.startY; // 移除y坐标的下限限制
            
            currentElement.x = newX;
            currentElement.y = newY;
            
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
                const currentBandElement = bandElements[draggingInfo.value.bandIndex] as HTMLElement;
                const currentBandRect = currentBandElement.getBoundingClientRect();
                
                // 计算元素相对于目标band的Y坐标
                // 1. 计算元素在当前band中的相对位置
                // 2. 加上当前band与目标band之间的偏移
                const currentElementInPage = (currentBandRect.top / currentZoom) + currentElement.y;
                relativeY = Math.round(currentElementInPage - (targetBandRect.top / currentZoom));
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
              dragCoordinates.value.x = Math.round(newX);
              dragCoordinates.value.y = Math.round(newY);
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
              const targetBand = bands.value[targetBandIndex];
              if (targetBand) {
                // 移除原band中的元素
                currentBand.elements.splice(draggingInfo.value.elementIndex, 1);
                
                // 计算元素相对于目标band的y坐标
                const paperRect = paperEl.getBoundingClientRect();
                const targetBandElement = document.querySelectorAll('.band')[targetBandIndex] as HTMLElement | undefined;
                if (targetBandElement) {
                  const targetBandRect = targetBandElement.getBoundingClientRect();
                
                  // 将元素绝对坐标转换为相对于目标band的坐标
                  // 1. 计算元素在页面中的绝对位置（基于paper的位置和当前元素y坐标）
                  const elementTopInPage = paperRect.top + currentElement.y;
                  // 2. 计算元素相对于目标band的位置
                  currentElement.y = Math.max(0, elementTopInPage - targetBandRect.top);
                
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
            // 元素位置保持拖动时的最后位置，不做额外调整
          }
        }
        
        // 清除高亮和坐标显示
        highlightedBandIndex.value = null;
        dragCoordinates.value.visible = false;
        
        draggingInfo.value = null;
        isDraggingOrResizing = false;
        
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
  const content = generateJRXMLContent(reportProperties.value, bands.value, reportFields.value, reportParameters.value);
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
  
  // 获取当前缩放比例
  const currentZoom = zoomLevel.value;
  
  const startY = event.clientY;
  const startHeight = bottomPanelHeight.value;
  
  const handleMouseMove = (e: MouseEvent): void => {
    // 计算高度变化（鼠标向上移动增加高度，向下移动减少高度）
    // 考虑缩放比例计算高度变化
    const deltaY = (startY - e.clientY) / currentZoom;
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

// 开始调整属性面板宽度
const startResizingPropertyPanel = (event: MouseEvent): void => {
  event.preventDefault();
  
  const startX = event.clientX;
  const startWidth = propertyPanelWidth.value;
  
  const handleMouseMove = (e: MouseEvent): void => {
    // 计算宽度变化（鼠标向左移动增加宽度，向右移动减少宽度）
    const deltaX = startX - e.clientX;
    const newWidth = Math.max(200, Math.min(600, startWidth + deltaX)); // 限制最小200px，最大600px
    propertyPanelWidth.value = newWidth;
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
    const content = generateJRXMLContent(reportProperties.value, bands.value, reportFields.value, reportParameters.value);
    
    // 如果内容有变化，保存到历史记录
    if (content !== jrxmlContent.value) {
      // 只在非拖拽/调整大小状态下保存历史
      if (!isDraggingOrResizing && historyStack.value.length === 0) {
        // 初始化时保存第一次状态
        saveStateToHistory();
      }
      jrxmlContent.value = content;
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
  newElement.x += 10;
  newElement.y += 10;
  
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
            distance = Math.abs(elementY - currentY) + Math.abs(elementX - currentX) * 0.1; // Y方向为主，X方向为辅
            break;
          case 'ArrowLeft':
          case 'ArrowRight':
            distance = Math.abs(elementX - currentX) + Math.abs(elementY - currentY) * 0.1; // X方向为主，Y方向为辅
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
  loadFromLocalStorage();
  // 初始加载后更新JRXML
  updateJRXML();
  
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
  
  // 为设计画布添加滚轮事件监听
  const designerCanvas = document.querySelector('.designer-canvas');
  if (designerCanvas) {
    designerCanvas.addEventListener('wheel', handleWheel, { passive: false });
    (window as any).pdfDesignerWheelListener = handleWheel;
  }
  
  // 获取paper元素并添加点击事件监听
  const paperElement = document.querySelector('.paper');
  if (paperElement) {
    paperElement.addEventListener('click', () => {
      handlePaperClick();
      setDesignAreaFocused();
    });
  }
  
  // 为底部面板和右侧属性面板添加点击事件以移除设计区域焦点
  const bottomPanel = document.querySelector('.bottom-panel');
  if (bottomPanel) {
    bottomPanel.addEventListener('click', removeDesignAreaFocused);
  }
  
  const rightPanel = document.querySelector('.property-panel');
  if (rightPanel) {
    rightPanel.addEventListener('click', removeDesignAreaFocused);
  }
  
  // 为左侧面板添加点击事件以移除设计区域焦点
  const leftPanel = document.querySelector('.element-panel');
  if (leftPanel) {
    leftPanel.addEventListener('click', removeDesignAreaFocused);
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
  const designerCanvas = document.querySelector('.designer-canvas');
  if (wheelListener && designerCanvas) {
    designerCanvas.removeEventListener('wheel', wheelListener);
  }
  
  // 移除paper点击事件监听器
  const handlePaperClick = (window as any).pdfDesignerPaperClickListener;
  const paperElement = document.querySelector('.paper');
  if (handlePaperClick && paperElement) {
    paperElement.removeEventListener('click', handlePaperClick);
  }
  
  // 移除面板点击事件监听器
  const bottomPanel = document.querySelector('.bottom-panel');
  const rightPanel = document.querySelector('.property-panel');
  const leftPanel = document.querySelector('.element-panel');
  const removeDesignAreaFocused = (window as any).pdfDesignerRemoveFocused;
  
  if (removeDesignAreaFocused) {
    if (bottomPanel) bottomPanel.removeEventListener('click', removeDesignAreaFocused);
    if (rightPanel) rightPanel.removeEventListener('click', removeDesignAreaFocused);
    if (leftPanel) leftPanel.removeEventListener('click', removeDesignAreaFocused);
  }
});

// 监听关键数据变化，自动保存和更新JRXML
watch(
  [reportProperties, bands, reportFields, reportParameters],
  () => {
    // 只在非拖拽/调整大小状态下更新
    if (!isDraggingOrResizing) {
      saveToLocalStorage();
      updateJRXML();
    }
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
    
    // 更新参数定义
    reportParameters.value = parsedData.parameters || [];
    
    // 更新bands
    bands.value = parsedData.bands;
    
    // 更新选中的band类型
    selectedBandTypes.value = parsedData.bands.map(band => band.type);
    
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
    const newHeight = Math.max(20, startHeight + deltaY);
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
    
    isDraggingOrResizing = true;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingInfo.value) {
        const currentBand = bands.value[resizingInfo.value.bandIndex];
        const currentElement = currentBand?.elements[resizingInfo.value.elementIndex];
        
        if (currentBand && currentElement) {
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
          const { rightMargin } = reportProperties.value;
          // 限制不能超出纸张右边界（考虑右边距）和band底部边界
          // 修正计算：使用正确的缩放比例计算
          const availableWidth = (paperWidth.value - rightMargin - currentElement.x);
          const availableHeight = (currentBand.height - currentElement.y);
          newWidth = Math.min(newWidth, availableWidth);
          newHeight = Math.min(newHeight, availableHeight);
          
          currentElement.width = newWidth;
          currentElement.height = newHeight;
        }
      }
    };
    
    const handleMouseUp = () => {
      // 保存状态到历史记录
      saveStateToHistory();
      
      resizingInfo.value = null;
      isDraggingOrResizing = false;
      
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

// 获取Band显示名称
const getBandDisplayName = (bandType: string): string => {
  const bandNames: { [key: string]: string } = {
    'background': '背景',
    'title': '标题',
    'pageHeader': '页眉',
    'columnHeader': '列标题',
    'detail': '详细数据',
    'columnFooter': '列脚',
    'pageFooter': '页脚',
    'lastPageFooter': '末页页脚',
    'summary': '汇总',
    'noData': '无数据'
  };
  return bandNames[bandType] || bandType;
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
          bands.value.splice(insertIndex, 0, newBand);
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
.element-panel {
  transition: width 0.3s ease;
  overflow: hidden;
}

.property-panel {
  overflow: hidden;
}

/* 当左右面板隐藏时，中间设计区域扩展 */
.designer-canvas {
  flex: 1;
  transition: all 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0; /* 移除内边距，让标尺占满整个区域 */
  position: relative;
}
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
  width: 25px; /* 减小宽度以避免遮挡标尺刻度值 */
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
  overflow: hidden;
  width: 100%; /* 确保占满剩余宽度 */
  min-width: 0; /* 允许flex子项收缩 */
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
  overflow: hidden;
  height: 100%; /* 确保占满整个高度 */
  min-height: 0; /* 允许flex子项收缩 */
  margin-left: -15px; /* 向左偏移以补偿corner-space宽度的减小 */
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

  /* 设置区域样式 */
  .settings-section {
    background-color: #f9f9f9;
    border-radius: 6px;
    padding: 12px;
    border: 1px solid #e8e8e8;
  }

  .settings-section h4 {
    margin-top: 0;
    margin-bottom: 12px;
    color: #333;
    font-size: 15px;
    font-weight: 600;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 6px;
  }

  /* 表单行布局 */
  .form-row {
    display: flex;
    gap: 12px;
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
    gap: 12px;
    margin-bottom: 12px;
  }

  .font-setting-item {
    flex: 1;
  }

  .font-setting-item select,
  .font-setting-item input {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 13px;
  }

  .font-style-options {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
  }

  .font-style-options label {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 0;
    font-weight: normal;
    font-size: 13px;
  }

  /* 紧凑Band设置样式 */
  .band-settings-compact {
    grid-column: span 1;
  }

.font-settings-section {
    grid-column: 1 / -1;
    padding: 12px;
    background-color: #f9f9f9;
    border-radius: 4px;
    margin-top: 8px;
  }

  .font-settings-section h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #333;
    font-size: 16px;
  }

.checkbox-group {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
  }

  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 0;
    font-weight: normal;
    font-size: 14px;
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
  flex: 1;
  min-height: 0;
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
  border-radius: 4px;
  border: 1px solid #ddd;
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
  padding: 16px;
  background-color: #f8f9fa;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
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
  background-size: 100% 20px;
  background-position: 0 1em;
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
  overflow: auto;
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

/* 缩放控制区域样式 */
.zoom-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 1rem;
}

/* 缩放按钮样式 */
.btn-zoom {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  background-color: #f0f0f0;
  color: #666;
  min-width: 36px;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-zoom:hover {
  background-color: #e6e6e6;
  color: #333;
}

/* 缩放选择框样式 */
.zoom-select {
  padding: 0.5rem;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: white;
  font-size: 0.9rem;
}

.element-actions {
  margin-top: 16px;
  text-align: right;
}

/* 对齐控制样式 */
.alignment-controls {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.align-button {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  background: #fff;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 12px;
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
  padding: 10px 16px;
  border-bottom: 1px solid #eee;
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
  position: relative;
}

/* 选择动画效果 */
.design-element.select-animation {
  animation: pulse 0.3s ease-in-out;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 2px #1890ff;
  }
  50% {
    box-shadow: 0 0 0 4px rgba(24, 144, 255, 0.5);
  }
  100% {
    box-shadow: 0 0 0 2px #1890ff;
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
/* 报表边距容器样式 */
.pager {
  position: relative;
  width: 100%;
  height: 100%;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(200, 200, 200, 0.2) 10px,
    rgba(200, 200, 200, 0.2) 20px
  );
  background-size: 20px 20px;
}

/* 坐标显示样式 */
.coordinates-display {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 1000;
  white-space: nowrap;
}

</style>