<template>
  <div class="element-properties">
    <h3>{{ t('properties.title') }}</h3>
    
    <!-- 报表属性 -->
    <div v-if="!selectedBandIndex && !selectedElement" class="property-section">
      <h4>{{ t('properties.reportProperties') }}</h4>
      
      <!-- Band高度设置 -->
      <div class="form-group">
        <h4>{{ t('properties.bandHeightSettings') }}</h4>
        <div class="band-heights-grid">
          <div v-for="(band, index) in bands" :key="index" class="band-height-item">
            <label>{{ getBandDisplayName(band.type) }}</label>
            <div class="band-height-control">
              <input 
                v-model.number="band.height" 
                type="number" 
                min="0"
                step="1"
                class="band-height-input"
                @change="ensureIntegerValue(band, 'height'); updateBandHeight(index)"
                @blur="ensureIntegerValue(band, 'height'); updateBandHeight(index)"
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
      <n-tabs type="segment">
        
        <!-- 基本属性标签页 -->
        <n-tab-pane name="basic" :tab="t('properties.basicProperties')" >
          <h4>{{ t('properties.basicProperties') }}</h4>
          <div class="basic-properties-grid">
            <div class="form-group">
              <label>{{ t('properties.x') }}</label>
              <input v-if="currentElement" v-model.number="currentElement.x" type="number" @change="ensureIntegerValue(currentElement, 'x')" />
            </div>
            <div class="form-group">
              <label>{{ t('properties.y') }}</label>
              <input v-if="currentElement" v-model.number="currentElement.y" type="number" @change="ensureIntegerValue(currentElement, 'y')" />
            </div>
            <div class="form-group">
              <label>{{ t('properties.width') }}</label>
              <input v-if="currentElement" v-model.number="currentElement.width" type="number" @change="ensureIntegerValue(currentElement, 'width')" />
            </div>
            <div class="form-group">
              <label>{{ t('properties.height') }}</label>
              <input v-if="currentElement" v-model.number="currentElement.height" type="number" @change="ensureIntegerValue(currentElement, 'height')" />
            </div>
          </div>
          
          <!-- 根据元素类型显示特定属性 -->
          <template v-if="currentElement.type === 'staticText'">
            <div class="form-group">
              <label>{{ t('properties.textContent') }}</label>
              <textarea v-if="currentElement" v-model="currentElement.text"></textarea>
            </div>
            <div class="form-group">
              <label>{{ t('properties.fontSize') }}</label>
              <input v-if="currentElement" v-model.number="currentElement.fontSize" type="number" />
            </div>
            <div class="checkbox-group">
              <label>
                <input v-if="currentElement" v-model="currentElement.isBold" type="checkbox" />
                {{ t('properties.bold') }}
              </label>
              <label>
                <input v-if="currentElement" v-model="currentElement.isItalic" type="checkbox" />
                {{ t('properties.italic') }}
              </label>
              <label>
                <input v-if="currentElement" v-model="currentElement.isUnderline" type="checkbox" />
                {{ t('properties.underline') }}
              </label>
            </div>
          </template>
          
          <template v-else-if="currentElement && currentElement.type === 'textField'">
            <div class="form-group" v-if="currentElement && currentElement.type === 'textField'">
              <label>{{ t('properties.expression') }}</label>
              <input v-if="currentElement" :value="getTextFieldExpression(currentElement)" @input="updateTextFieldExpression" type="text" />
              <small>{{ t('properties.expressionHint', { fieldHolder: '$F{fieldName}' }) }}</small>
            </div>
            <div class="form-group">
              <label>{{ t('properties.pattern') }}</label>
              <input v-if="currentElement" v-model="currentElement.pattern" type="text" />
              <small>{{ t('properties.patternHint') }}</small>
            </div>
          </template>
          
          <!-- 表格属性 -->
          <template v-else-if="currentElement && currentElement.type === 'table'">
            <div class="form-group">
              <label>{{ t('properties.tableDataset') }}</label>
              <input 
                v-if="currentElement.dataset" 
                v-model="(currentElement as any).dataset.name" 
                type="text" 
                :placeholder="t('properties.tableDataset')" 
              />
            </div>
            
            <div class="form-group">
              <label>{{ t('properties.connectionExpression') }}</label>
              <input 
                v-if="currentElement.dataset" 
                v-model="(currentElement as any).dataset.connectionExpression" 
                type="text" 
                placeholder="$P{REPORT_CONNECTION}" 
              />
            </div>
            
            <div class="form-group">
              <label>{{ t('properties.whenNoDataType') }}</label>
              <select 
                v-model="(currentElement as any).whenNoDataType" 
                @change="emit('update-jrxml')"
              >
                <option :value="undefined">{{ t('properties.default') }}</option>
                <option value="Blank">{{ t('properties.whenNoDataTypeOptions.Blank') }}</option>
                <option value="NoDataCell">{{ t('properties.whenNoDataTypeOptions.NoDataCell') }}</option>
                <option value="AllSectionsNoDetail">{{ t('properties.whenNoDataTypeOptions.AllSectionsNoDetail') }}</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>{{ t('properties.tableColumns') }}</label>
              <div class="table-column-actions">
                <n-button 
                  class="add-column-btn" 
                  @click="addTableColumn"
                  :title="t('properties.addColumn')"
                  type="primary"
                >
                  + {{ t('properties.addColumn') }}
                </n-button>
                <n-button 
                  class="add-column-btn" 
                  @click="openFieldSelectionModal"
                  :title="t('properties.addColumnFromDataset')"
                  type="default"
                >
                  ↓ {{ t('properties.addColumnFromDataset') }}
                </n-button>
              </div>
              <div v-if="currentElement.columns" class="table-columns-list">
                <div 
                  v-for="(column, index) in (currentElement as any).columns" 
                  :key="column.uuid || index" 
                  class="table-column-item"
                  draggable="true"
                  @dragstart="onDragStart($event, Number(index))"
                  @dragover="onDragOver($event)"
                  @drop="onDrop($event, Number(index))"
                >
                  <div class="table-column-header">
                    <span class="drag-handle">☰</span>
                    <span>{{ column.name }}</span>
                    <n-button 
                      class="remove-column-btn" 
                      @click="removeTableColumn(Number(index))"
                      :title="t('properties.removeColumn')"
                      type="error"
                      quaternary
                      circle
                      size="small"
                    >
                      ✕
                    </n-button>
                  </div>
                  <div class="table-column-properties">
                    <div class="form-group small">
                      <label>{{ t('properties.columnWidth') }}</label>
                      <input 
                        v-model.number="column.width" 
                        type="number" 
                        min="10"
                        step="1"
                        class="small-input"
                        @change="updateColumnWidth(column, Number(index)); emit('update-jrxml')"
                      />
                    </div>
                    <div class="form-group small">
                      <label>{{ t('properties.columnName') }}</label>
                      <input 
                        v-model="column.name" 
                        type="text" 
                        class="small-input"
                        @change="emit('update-jrxml')"
                      />
                    </div>
                    <div class="form-group small full-width">
                      <label>{{ t('properties.fieldExpression') }}</label>
                      <input 
                        v-model="column.detailCell.expression" 
                        type="text" 
                        class="small-input"
                        :placeholder="t('properties.expressionHint', { fieldHolder: '$F{fieldName}' })"
                        @change="emit('update-jrxml')"
                      />
                    </div>
                    <div class="form-group small full-width">
                      <label>{{ t('properties.tableHeader') }}</label>
                      <input 
                        v-model="column.tableHeader.text" 
                        type="text" 
                        class="small-input"
                        :placeholder="t('properties.tableHeaderPlaceholder')"
                        @change="emit('update-jrxml')"
                      />
                    </div>
                    <div class="form-group small full-width">
                      <label>{{ t('properties.tableFooter') }}</label>
                      <input 
                        :value="column.tableFooter?.expression || ''"
                        @input="(e) => {
                          initTableCell(column, 'tableFooter');
                          column.tableFooter.expression = (e.target as HTMLInputElement).value;
                          emit('update-jrxml');
                        }"
                        type="text" 
                        class="small-input"
                        :placeholder="t('properties.tableFooterPlaceholder')"
                      />
                    </div>
                    <div class="form-group small full-width">
                      <label>{{ t('properties.columnFooter') }}</label>
                      <input 
                        :value="column.columnFooter?.expression || ''"
                        @input="(e) => {
                          initTableCell(column, 'columnFooter');
                          column.columnFooter.expression = (e.target as HTMLInputElement).value;
                          emit('update-jrxml');
                        }"
                        type="text" 
                        class="small-input"
                        :placeholder="t('properties.columnFooterPlaceholder')"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 从数据集选择字段的模态框 -->
            <BaseModal
              :visible="showFieldSelectionModal"
              :title="t('properties.selectFieldsFromDataset')"
              @update:visible="showFieldSelectionModal = $event"
              @confirm="addSelectedFieldsAsColumns"
              @cancel="showFieldSelectionModal = false"
            >
              <div class="field-selection-content">
                <div class="available-fields">
                  <h4>{{ t('properties.availableFields') }}</h4>
                  <div class="fields-list">
                    <div 
                      v-for="(field, index) in availableFields" 
                      :key="index"
                      class="field-item"
                      :class="{ selected: selectedFields.includes(field.name) }"
                      @click="toggleFieldSelection(field.name)"
                    >
                      <input 
                        type="checkbox" 
                        v-model="selectedFields"
                        :value="field.name"
                      />
                      <span class="field-name">{{ field.name }}</span>
                      <span class="field-type">{{ field.class }}</span>
                    </div>
                  </div>
                </div>
                <div class="selected-fields">
                  <h4>{{ t('properties.selectedFields') }}</h4>
                  <div class="fields-list">
                    <div 
                      v-for="(fieldName, index) in selectedFields" 
                      :key="index"
                      class="field-item selected"
                    >
                      <span class="field-name">{{ fieldName }}</span>
                      <button 
                        class="remove-field-btn"
                        @click="toggleFieldSelection(fieldName)"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </BaseModal>
          </template>
          
          <!-- 使用计算属性来简化模板中的类型检查 -->
          <div v-if="currentElement">
            <!-- 静态文本特定属性 -->
            <template v-if="elementType === 'staticText'">
              <div class="form-group">
                <label>{{ t('properties.textContent') }}</label>
                <textarea v-model="(currentElement as any).text"></textarea>
              </div>
              <div class="form-group">
                <label>{{ t('properties.fontSize') }}</label>
                <input v-model.number="(currentElement as any).fontSize" type="number" />
              </div>
              <div class="checkbox-group">
                <label>
                  <input v-model="(currentElement as any).isBold" type="checkbox" />
                  {{ t('properties.bold') }}
                </label>
                <label>
                  <input v-model="(currentElement as any).isItalic" type="checkbox" />
                  {{ t('properties.italic') }}
                </label>
                <label>
                  <input v-model="(currentElement as any).isUnderline" type="checkbox" />
                  {{ t('properties.underline') }}
                </label>
              </div>
            </template>
            
            <!-- 文本字段特定属性 -->
            <template v-else-if="elementType === 'textField'">
              <div class="form-group">
                <label>{{ t('properties.expression') }}</label>
                <input v-model="(currentElement as any).expression" type="text" />
              </div>
              <div class="form-group">
                <label>{{ t('properties.pattern') }}</label>
                <input v-model="(currentElement as any).pattern" type="text" />
              </div>
              <div class="checkbox-group">
                <label>
                  <input v-model="(currentElement as any).isBlankWhenNull" type="checkbox" />
                  {{ t('properties.blankWhenNull') }}
                </label>
              </div>
              <div class="form-group">
                <label>{{ t('properties.evaluationTime') }}</label>
                <select v-model="(currentElement as any).evaluationTime">
                  <option value="Now">{{ t('properties.evalTime.Now') }}</option>
                  <option value="Report">{{ t('properties.evalTime.Report') }}</option>
                  <option value="Page">{{ t('properties.evalTime.Page') }}</option>
                  <option value="Column">{{ t('properties.evalTime.Column') }}</option>
                  <option value="Group">{{ t('properties.evalTime.Group') }}</option>
                  <option value="Band">{{ t('properties.evalTime.Band') }}</option>
                  <option value="Auto">{{ t('properties.evalTime.Auto') }}</option>
                </select>
              </div>
            </template>
            
            <!-- 图片特定属性 -->
            <template v-else-if="elementType === 'image'">
              <div class="form-group">
                <label>{{ t('properties.imageExpression') }}</label>
                <input v-model="(currentElement as any).imageExpression" type="text" />
                <small>{{ t('properties.imageExpressionHint', { imageFileHolder: '$F{imageFieldName}' }) }}</small>
              </div>
            </template>
            
            <!-- 矩形特定属性 -->
            <template v-else-if="elementType === 'rectangle'">
              <div class="form-group">
                <label>{{ t('properties.radius') }}</label>
                <input v-model.number="(currentElement as any).radius" type="number" min="0" @change="ensureIntegerValue(currentElement, 'radius')" />
              </div>
            </template>
            
            <!-- 分页符特定属性 -->
            <template v-else-if="elementType === 'break'">
              <div class="form-group">
                <label>{{ t('properties.breakType') }}</label>
                <select v-model="(currentElement as any).breakType" @change="emit('update-jrxml')">
                  <option value="Page">{{ t('properties.pageBreak') }}</option>
                  <option value="Column">{{ t('properties.columnBreak') }}</option>
                </select>
              </div>
            </template>
            
            <!-- 框架特定属性 -->
            <template v-else-if="elementType === 'frame'">
              <div class="form-group">
                <label>{{ t('properties.layoutMode') }}</label>
                <select v-model="(currentElement as any).layout" @change="emit('update-jrxml')">
                  <option :value="undefined">{{ t('properties.freeLayout') }}</option>
                  <option value="HorizontalLayout">{{ t('properties.horizontalLayout') }}</option>
                  <option value="VerticalLayout">{{ t('properties.verticalLayout') }}</option>
                </select>
              </div>
            </template>
            
            <!-- 通用文本属性 -->
            <template v-if="['staticText', 'textField'].includes(elementType)">
              <div class="form-group">
                <label>{{ t('properties.textAlignment') }}</label>
                <select v-model="(currentElement as any).textAlignment">
                  <option value="Left">{{ t('properties.left') }}</option>
                  <option value="Center">{{ t('properties.center') }}</option>
                  <option value="Right">{{ t('properties.right') }}</option>
                  <option value="Justified">{{ t('properties.justified') }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ t('properties.verticalAlignment') }}</label>
                <select v-model="(currentElement as any).verticalAlignment">
                  <option value="Top">{{ t('properties.top') }}</option>
                  <option value="Middle">{{ t('properties.middle') }}</option>
                  <option value="Bottom">{{ t('properties.bottom') }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ t('properties.fontSize') }}</label>
                <input v-model.number="(currentElement as any).fontSize" type="number" />
              </div>
              <div class="checkbox-group">
                <label>
                  <input v-model="(currentElement as any).isBold" type="checkbox" />
                  {{ t('properties.bold') }}
                </label>
                <label>
                  <input v-model="(currentElement as any).isItalic" type="checkbox" />
                  {{ t('properties.italic') }}
                </label>
                <label>
                  <input v-model="(currentElement as any).isUnderline" type="checkbox" />
                  {{ t('properties.underline') }}
                </label>
              </div>
            </template>
          </div>
        </n-tab-pane>
        
        <!-- 边框设置标签页 -->
        <n-tab-pane name="box" :tab="t('properties.boxSettings')" >
          <template v-if="currentElement && currentElement.type === 'break'">
            <div class="box-section">
              <p style="font-size: 12px; color: #666;">{{ t('properties.breakNoBorder') }}</p>
            </div>
          </template>
          <template v-else>
            <h4>{{ t('properties.boxSettings') }}</h4>
            
            <!-- 矩形/椭圆元素的边框设置 (统一设置) -->
            <template v-if="currentElement && (currentElement.type === 'rectangle' || currentElement.type === 'ellipse')">
              <div class="box-section">
                <h5>{{ t('properties.unifiedBorder') }}</h5>
                <p style="font-size: 12px; color: #666; margin-bottom: 12px;">{{ t('properties.unifiedBorderHint') }}</p>
                
                <div class="border-side-group">
                  <label class="side-label">{{ t('properties.style') }}</label>
                  <select :value="getRectangleBorderStyle()" @change="setRectangleBorderStyle(($event.target as HTMLSelectElement).value)" class="side-control">
                    <option value="">{{ t('properties.none') }}</option>
                    <option value="Solid">{{ t('properties.solid') }}</option>
                    <option value="Dashed">{{ t('properties.dashed') }}</option>
                    <option value="Dotted">{{ t('properties.dotted') }}</option>
                    <option value="Double">{{ t('properties.double') }}</option>
                  </select>
                </div>
                
                <div class="border-side-group">
                  <label class="side-label">{{ t('properties.width') }}</label>
                  <input :value="getRectangleBorderWidth()" @input="setRectangleBorderWidth(($event.target as HTMLInputElement).value)" type="number" min="0" max="10" step="0.5" class="side-control" :placeholder="t('properties.width')" />
                </div>
                
                <div class="border-side-group">
                  <label class="side-label">{{ t('properties.color') }}</label>
                  <input :value="getRectangleBorderColor()" @input="setRectangleBorderColor(($event.target as HTMLInputElement).value)" type="color" class="color-control" style="flex: 1;" />
                </div>
              </div>
            </template>
            
            <!-- 其他元素的边框设置 (支持各边独立设置) -->
            <template v-else>
              <!-- 快捷边框设置 -->
              <div class="box-section">
                <h5>{{ t('properties.quickSettings') }}</h5>
                <div class="border-quick-actions">
                  <n-button @click="removeAllBorders" type="default">{{ t('properties.noBorders') }}</n-button>
                  <n-button @click="addSolidBorder" type="primary">{{ t('properties.allBorders') }}</n-button>
                </div>
              </div>
              
              <!-- 各边边框设置 -->
              <div class="box-section">
                <h5>{{ t('properties.sideBorders') }}</h5>
                
                <!-- 上边 -->
                <div class="border-side-group">
                  <label class="side-label">{{ t('properties.topSide') }}</label>
                  <select v-if="currentElement && currentElement.box" :value="getSideBorderStyle('top')" @change="setSideBorderStyle('top', ($event.target as HTMLSelectElement).value)" class="side-control">
                    <option value="">{{ t('properties.none') }}</option>
                    <option value="Solid">{{ t('properties.solid') }}</option>
                    <option value="Dashed">{{ t('properties.dashed') }}</option>
                    <option value="Dotted">{{ t('properties.dotted') }}</option>
                    <option value="Double">{{ t('properties.double') }}</option>
                  </select>
                  <input v-if="currentElement && currentElement.box" :value="getSideBorderWidth('top')" @input="setSideBorderWidth('top', ($event.target as HTMLInputElement).value)" type="number" min="0" max="10" step="0.5" class="width-control" :placeholder="t('properties.width')" />
                  <input v-if="currentElement && currentElement.box" :value="getSideBorderColor('top')" @input="setSideBorderColor('top', ($event.target as HTMLInputElement).value)" type="color" class="color-control" />
                </div>
                
                <!-- 左边 -->
                <div class="border-side-group">
                  <label class="side-label">{{ t('properties.leftSide') }}</label>
                  <select v-if="currentElement && currentElement.box" :value="getSideBorderStyle('left')" @change="setSideBorderStyle('left', ($event.target as HTMLSelectElement).value)" class="side-control">
                    <option value="">{{ t('properties.none') }}</option>
                    <option value="Solid">{{ t('properties.solid') }}</option>
                    <option value="Dashed">{{ t('properties.dashed') }}</option>
                    <option value="Dotted">{{ t('properties.dotted') }}</option>
                    <option value="Double">{{ t('properties.double') }}</option>
                  </select>
                  <input v-if="currentElement && currentElement.box" :value="getSideBorderWidth('left')" @input="setSideBorderWidth('left', ($event.target as HTMLInputElement).value)" type="number" min="0" max="10" step="0.5" class="width-control" :placeholder="t('properties.width')" />
                  <input v-if="currentElement && currentElement.box" :value="getSideBorderColor('left')" @input="setSideBorderColor('left', ($event.target as HTMLInputElement).value)" type="color" class="color-control" />
                </div>
                
                <!-- 下边 -->
                <div class="border-side-group">
                  <label class="side-label">{{ t('properties.bottomSide') }}</label>
                  <select v-if="currentElement && currentElement.box" :value="getSideBorderStyle('bottom')" @change="setSideBorderStyle('bottom', ($event.target as HTMLSelectElement).value)" class="side-control">
                    <option value="">{{ t('properties.none') }}</option>
                    <option value="Solid">{{ t('properties.solid') }}</option>
                    <option value="Dashed">{{ t('properties.dashed') }}</option>
                    <option value="Dotted">{{ t('properties.dotted') }}</option>
                    <option value="Double">{{ t('properties.double') }}</option>
                  </select>
                  <input v-if="currentElement && currentElement.box" :value="getSideBorderWidth('bottom')" @input="setSideBorderWidth('bottom', ($event.target as HTMLInputElement).value)" type="number" min="0" max="10" step="0.5" class="width-control" :placeholder="t('properties.width')" />
                  <input v-if="currentElement && currentElement.box" :value="getSideBorderColor('bottom')" @input="setSideBorderColor('bottom', ($event.target as HTMLInputElement).value)" type="color" class="color-control" />
                </div>
                
                <!-- 右边 -->
                <div class="border-side-group">
                  <label class="side-label">{{ t('properties.rightSide') }}</label>
                  <select v-if="currentElement && currentElement.box" :value="getSideBorderStyle('right')" @change="setSideBorderStyle('right', ($event.target as HTMLSelectElement).value)" class="side-control">
                    <option value="">{{ t('properties.none') }}</option>
                    <option value="Solid">{{ t('properties.solid') }}</option>
                    <option value="Dashed">{{ t('properties.dashed') }}</option>
                    <option value="Dotted">{{ t('properties.dotted') }}</option>
                    <option value="Double">{{ t('properties.double') }}</option>
                  </select>
                  <input v-if="currentElement && currentElement.box" :value="getSideBorderWidth('right')" @input="setSideBorderWidth('right', ($event.target as HTMLInputElement).value)" type="number" min="0" max="10" step="0.5" class="width-control" :placeholder="t('properties.width')" />
                  <input v-if="currentElement && currentElement.box" :value="getSideBorderColor('right')" @input="setSideBorderColor('right', ($event.target as HTMLInputElement).value)" type="color" class="color-control" />
                </div>
              </div>
              
              <!-- 边距设置 -->
              <div class="box-section">
                <h5>{{ t('properties.marginSettings') }}</h5>
                <div class="form-group">
                  <label>{{ t('properties.globalMargin') }}</label>
                  <input v-if="currentElement && currentElement.box" v-model.number="currentElement.box.padding" type="number" :placeholder="t('properties.globalMargin')" />
                  <small>{{ t('properties.globalMarginHint') }}</small>
                </div>
                
                <div class="padding-grid">
                  <div class="form-group">
                    <label>{{ t('properties.topMargin') }}</label>
                    <input v-if="currentElement && currentElement.box" v-model.number="currentElement.box.topPadding" type="number" />
                  </div>
                  <div class="form-group">
                    <label>{{ t('properties.leftMargin') }}</label>
                    <input v-if="currentElement && currentElement.box" v-model.number="currentElement.box.leftPadding" type="number" />
                  </div>
                  <div class="form-group">
                    <label>{{ t('properties.bottomMargin') }}</label>
                    <input v-if="currentElement && currentElement.box" v-model.number="currentElement.box.bottomPadding" type="number" />
                  </div>
                  <div class="form-group">
                    <label>{{ t('properties.rightMargin') }}</label>
                    <input v-if="currentElement && currentElement.box" v-model.number="currentElement.box.rightPadding" type="number" />
                  </div>
                </div>
              </div>
            </template>
          </template>
        </n-tab-pane>
        
        <!-- 样式设置标签页 -->
        <n-tab-pane name="style" :tab="t('properties.styleSettings')" >
          <template v-if="currentElement && currentElement.type === 'break'">
            <div class="box-section">
              <p style="font-size: 12px; color: #666;">{{ t('properties.breakNoStyle') }}</p>
            </div>
          </template>
          <template v-else>
            <h4>{{ t('properties.styleSettings') }}</h4>
            <div class="form-group">
              <label>{{ t('properties.backgroundColor') }}</label>
            <div class="color-picker-container" style="display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; gap: 8px; align-items: center;">
                <input v-if="currentElement" v-model="tempColor" type="color" @input="updateBackcolorFromControls" style="width: 40px; padding: 0; border: 1px solid #ddd; cursor: pointer;" />
                <input 
                  v-if="currentElement" 
                  v-model.lazy="currentElement.backcolor" 
                  type="text" 
                  @change="onBackcolorChange"
                  placeholder="#RRGGBB 或 rgba(...)"
                  style="flex: 1; font-size: 12px; color: #666; border: 1px solid #ddd; padding: 4px; border-radius: 4px;" 
                />
              </div>
              
              <!-- 透明度滑块 -->
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 12px; color: #666; width: 40px;">{{ t('properties.opacity') }}</span>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  v-model.number="tempOpacity"
                  @input="updateBackcolorFromControls"
                  style="flex: 1;"
                />
                <span style="font-size: 12px; color: #666; width: 30px; text-align: right;">{{ Math.round(tempOpacity * 100) }}%</span>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label>{{ t('properties.backgroundMode') }}</label>
            <select v-if="currentElement" v-model="currentElement.mode" @change="emit('update-jrxml')">
              <option :value="undefined">{{ t('properties.defaultTransparent') }}</option>
              <option value="Transparent">{{ t('properties.transparent') }}</option>
              <option value="Opaque">{{ t('properties.opaque') }}</option>
            </select>
          </div>
          
          <template v-if="currentElement && currentElement.type !== 'line' && currentElement.type !== 'image' && currentElement.type !== 'frame'">
            <div class="form-group">
              <label>{{ t('properties.fontName') }}</label>
              <select v-if="currentElement" v-model="currentElement.fontFamily" style="appearance: none; -webkit-appearance: none;">
                <option value="">{{ t('properties.useDefaultFont') }}</option>
                <option v-for="font in availableFonts" :key="font" :value="font">{{ font }}</option>
              </select>
              <small class="font-hint">{{ t('properties.fontHint') }}</small>
            </div>
            
            <div class="form-group">
              <label>{{ t('properties.textAlignment') }}</label>
              <div class="alignment-controls">
                <n-button 
                  v-for="align in ['Left', 'Center', 'Right']" 
                  :key="align"
                  @click="setHorizontalAlignment(align as 'Left' | 'Center' | 'Right')"
                  :type="currentElement && currentElement.textAlignment === align ? 'primary' : 'default'"
                  :title="t(`properties.${align.toLowerCase()}`)"
                >
                  {{ t(`properties.${align.toLowerCase()}`) }}
                </n-button>
              </div>
            </div>
            
            <div class="form-group">
              <label>{{ t('properties.verticalAlignment') }}</label>
              <div class="alignment-controls">
                <n-button 
                  v-for="align in ['Top', 'Middle', 'Bottom']" 
                  :key="align"
                  @click="setVerticalAlignment(align as 'Top' | 'Middle' | 'Bottom')"
                  :type="currentElement && currentElement.verticalAlignment === align ? 'primary' : 'default'"
                  :title="t(`properties.${align.toLowerCase()}`)"
                >
                  {{ t(`properties.${align.toLowerCase()}`) }}
                </n-button>
              </div>
            </div>
            
            <div class="checkbox-group">
              <label>
                <input v-if="currentElement" v-model="currentElement.isBold" type="checkbox" />
                {{ t('properties.bold') }}
              </label>
              <label>
                <input v-if="currentElement" v-model="currentElement.isItalic" type="checkbox" />
                {{ t('properties.italic') }}
              </label>
              <label>
                <input v-if="currentElement" v-model="currentElement.isUnderline" type="checkbox" />
                {{ t('properties.underline') }}
              </label>
            </div>
          </template>
          </template>
        </n-tab-pane>
      </n-tabs>
      
      <div class="element-actions">
        <n-button @click="deleteElement" type="error">{{ t('properties.deleteElement') }}</n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { NButton, NTabs, NTabPane } from 'naive-ui';
import type { Band, SelectedElementInfo, TableDataset } from '../../../types';
import { getAvailableFonts } from '../../../utils/fontUtils';
import BaseModal from '../../modals/BaseModal.vue';

const { t } = useI18n();

interface Props {
  selectedBandIndex: number | null;
  selectedElement: SelectedElementInfo | null;
  bands: Band[];
  reportProperties: any;
  subDatasets?: TableDataset[];
}

interface Emits {
  (e: 'update:bands', bands: Band[]): void;
  (e: 'delete-element'): void;
  (e: 'update-jrxml'): void;
  (e: 'save-state'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 可用字体列表
const availableFonts = ref<string[]>([]);

// 临时颜色和透明度变量
const tempColor = ref('#000000');
const tempOpacity = ref(1);

onMounted(async () => {
  availableFonts.value = await getAvailableFonts();
});

// 计算属性
const currentElement = computed(() => {
  if (props.selectedElement && props.bands && Array.isArray(props.bands)) {
    const band = props.bands[props.selectedElement.bandIndex];
    if (band && band.elements && Array.isArray(band.elements)) {
      // 检查是否是嵌套在Frame中的元素
      if (props.selectedElement.parentFrameIndex !== undefined) {
        const frame = band.elements[props.selectedElement.parentFrameIndex];
        if (frame && frame.type === 'frame' && frame.elements) {
          return frame.elements[props.selectedElement.elementIndex];
        }
      } else {
        return band.elements[props.selectedElement.elementIndex];
      }
    }
  }
  return null;
});

// 计算当前元素类型
const elementType = computed(() => {
  return currentElement.value?.type || '';
});

// 获取Band显示名称
function getBandDisplayName(bandType: string): string {
  // Use t() with dynamic key. 
  // Assuming keys exist in bandNames section of locale files.
  return t(`bandNames.${bandType}`);
}

// 更新Band高度
function updateBandHeight(_index: number) {
  const updatedBands = [...props.bands];
  emit('save-state');
  emit('update:bands', updatedBands);
  emit('update-jrxml');
}

// 确保坐标值为整数
function ensureIntegerValue(element: any, property: string) {
  if (element[property] !== undefined) {
    element[property] = Math.round(element[property]);
  }
}

// 设置水平对齐方式
function setHorizontalAlignment(alignment: 'Left' | 'Center' | 'Right') {
  if (currentElement.value) {
    emit('save-state');
    currentElement.value.textAlignment = alignment;
    emit('update-jrxml');
  }
}

// 设置垂直对齐方式
function setVerticalAlignment(alignment: 'Top' | 'Middle' | 'Bottom') {
  if (currentElement.value) {
    emit('save-state');
    currentElement.value.verticalAlignment = alignment;
    emit('update-jrxml');
  }
}

// 获取文本字段的表达式
function getTextFieldExpression(element: any) {
  if (element.expression) {
    return element.expression;
  } else if (element.fieldName) {
    return `$F{${element.fieldName}}`;
  }
  return '';
}

// 更新文本字段的表达式
function updateTextFieldExpression(event: Event) {
  if (!currentElement.value || currentElement.value.type !== 'textField') return;
  
  const newExpression = (event.target as HTMLInputElement).value;
  
  emit('save-state');
  currentElement.value.expression = newExpression;
  
  emit('update-jrxml');
}

// 各边边框属性访问函数
function getSideBorderWidth(side: string): number {
  if (!currentElement.value?.box) return 0;
  const box = currentElement.value.box;
  const penKey = `${side}Pen`;
  const widthKey = `${side}BorderWidth`;
  if (box[widthKey] !== undefined) return box[widthKey];
  if (box[penKey]?.lineWidth !== undefined) return box[penKey].lineWidth;
  // Fallback to global pen
  if (box.pen?.lineWidth !== undefined) return box.pen.lineWidth;
  return 0;
}

function setSideBorderWidth(side: string, value: string) {
  if (!currentElement.value?.box) return;
  const numValue = parseFloat(value) || 0;
  const widthKey = `${side}BorderWidth`;
  const penKey = `${side}Pen`;
  emit('save-state');
  currentElement.value.box[widthKey] = numValue;
  if (!currentElement.value.box[penKey]) {
    currentElement.value.box[penKey] = {};
  }
  currentElement.value.box[penKey].lineWidth = numValue;
  emit('update-jrxml');
}

function getSideBorderStyle(side: string): string {
  if (!currentElement.value?.box) return '';
  const box = currentElement.value.box;
  const penKey = `${side}Pen`;
  const styleKey = `${side}BorderStyle`;
  if (box[styleKey] !== undefined) return box[styleKey];
  if (box[penKey]?.lineStyle !== undefined) return box[penKey].lineStyle;
  // Fallback to global pen
  if (box.pen?.lineStyle !== undefined) return box.pen.lineStyle;
  return '';
}

function setSideBorderStyle(side: string, value: string) {
  if (!currentElement.value?.box) return;
  const box = currentElement.value.box;
  const styleKey = `${side}BorderStyle`;
  const penKey = `${side}Pen`;
  emit('save-state');
  box[styleKey] = value;
  if (!box[penKey]) {
    box[penKey] = {};
  }
  box[penKey].lineStyle = value;
  emit('update-jrxml');
}

function getSideBorderColor(side: string): string {
  if (!currentElement.value?.box) return '#000000';
  const box = currentElement.value.box;
  const penKey = `${side}Pen`;
  const colorKey = `${side}BorderColor`;
  if (box[colorKey] !== undefined) return box[colorKey];
  if (box[penKey]?.lineColor !== undefined) return box[penKey].lineColor;
  // Fallback to global pen
  if (box.pen?.lineColor !== undefined) return box.pen.lineColor;
  return '#000000';
}

function setSideBorderColor(side: string, value: string) {
  if (!currentElement.value?.box) return;
  const box = currentElement.value.box;
  const colorKey = `${side}BorderColor`;
  const penKey = `${side}Pen`;
  emit('save-state');
  box[colorKey] = value;
  if (!box[penKey]) {
    box[penKey] = {};
  }
  box[penKey].lineColor = value;
  emit('update-jrxml');
}

function removeAllBorders() {
  if (!currentElement.value?.box) return;
  const box = currentElement.value.box;
  emit('save-state');
  ['top', 'left', 'bottom', 'right'].forEach(side => {
    const widthKey = `${side}BorderWidth`;
    const styleKey = `${side}BorderStyle`;
    const colorKey = `${side}BorderColor`;
    const penKey = `${side}Pen`;
    box[widthKey] = 0;
    box[styleKey] = '';
    box[colorKey] = '';
    box[penKey] = { lineWidth: 0, lineStyle: '', lineColor: '' };
  });
  emit('update-jrxml');
}

function addSolidBorder() {
  if (!currentElement.value?.box) return;
  const box = currentElement.value.box;
  emit('save-state');
  ['top', 'left', 'bottom', 'right'].forEach(side => {
    const widthKey = `${side}BorderWidth`;
    const styleKey = `${side}BorderStyle`;
    const colorKey = `${side}BorderColor`;
    const penKey = `${side}Pen`;
    box[widthKey] = 1;
    box[styleKey] = 'Solid';
    box[colorKey] = '#000000';
    if (!box[penKey]) {
      box[penKey] = {};
    }
    box[penKey].lineWidth = 1;
    box[penKey].lineStyle = 'Solid';
    box[penKey].lineColor = '#000000';
  });
  emit('update-jrxml');
}

// 监听 currentElement.backcolor 变化，更新临时变量
watch(() => currentElement.value?.backcolor, (newVal) => {
  if (!newVal) {
    // 当元素没有背景色时，默认显示白色透明，避免受上一个选中元素颜色的影响
    tempColor.value = '#ffffff';
    tempOpacity.value = 0;
    return;
  }
  
  // 解析颜色
  if (newVal.startsWith('#')) {
    tempColor.value = newVal;
    tempOpacity.value = 1;
  } else if (newVal.startsWith('rgba')) {
    // 解析 rgba(r, g, b, a)
    const match = newVal.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      const r = parseInt(match[1]!);
      const g = parseInt(match[2]!);
      const b = parseInt(match[3]!);
      const a = match[4] ? parseFloat(match[4]) : 1;
      
      // RGB 转 Hex
      const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      tempColor.value = hex;
      tempOpacity.value = a;
    }
  } else if (newVal.startsWith('rgb')) {
    // 解析 rgb(r, g, b)
    const match = newVal.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const r = parseInt(match[1]!);
      const g = parseInt(match[2]!);
      const b = parseInt(match[3]!);
      
      // RGB 转 Hex
      const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      tempColor.value = hex;
      tempOpacity.value = 1;
    }
  }
}, { immediate: true });

// 初始化表格单元格
function initTableCell(column: any, cellType: 'tableFooter' | 'columnFooter') {
  if (!column[cellType]) {
    column[cellType] = {
      type: 'textField',
      x: 0,
      y: 0,
      width: column.width,
      height: 30,
      expression: ''
    };
  }
}

// 更新列宽度，同时更新所有相关单元格的宽度
function updateColumnWidth(column: any, index: number) {
  if (!column) return;
  
  const newWidth = column.width;
  
  // 更新所有相关单元格的宽度
  if (column.tableHeader) {
    column.tableHeader.width = newWidth;
  }
  if (column.columnHeader) {
    column.columnHeader.width = newWidth;
  }
  if (column.detailCell) {
    column.detailCell.width = newWidth;
  }
  if (column.columnFooter) {
    column.columnFooter.width = newWidth;
  }
  if (column.tableFooter) {
    column.tableFooter.width = newWidth;
  }
}

// 字段选择模态框相关
const showFieldSelectionModal = ref(false);
const selectedFields = ref<string[]>([]);
const availableFields = computed(() => {
  if (!currentElement.value || currentElement.value.type !== 'table' || !props.subDatasets) return [];
  
  const tableElement = currentElement.value as any;
  const datasetName = tableElement.dataset?.name;
  
  if (!datasetName) return [];
  
  // 在subDatasets中查找匹配的数据集
  const matchingDataset = props.subDatasets.find(dataset => dataset.name === datasetName);
  return matchingDataset?.fields || [];
});

// 打开字段选择模态框
function openFieldSelectionModal() {
  if (!currentElement.value || currentElement.value.type !== 'table') return;
  
  // Reset selected fields
  selectedFields.value = [];
  
  // Get current table columns
  const tableElement = currentElement.value as any;
  if (tableElement.columns) {
    // Extract field names from existing columns
    const usedFieldNames = tableElement.columns
      .map((column: any) => {
        if (column.detailCell?.expression) {
          // Match field expression pattern like $F{fieldName}
          const match = column.detailCell.expression.match(/\$F\{([^}]+)\}/);
          return match ? match[1] : null;
        }
        return null;
      })
      .filter((fieldName: string | null) => fieldName !== null);
    
    // Set selected fields to used field names
    selectedFields.value = usedFieldNames as string[];
  }
  
  showFieldSelectionModal.value = true;
}

// 切换字段选择状态
function toggleFieldSelection(fieldName: string) {
  const index = selectedFields.value.indexOf(fieldName);
  if (index === -1) {
    selectedFields.value.push(fieldName);
  } else {
    selectedFields.value.splice(index, 1);
  }
}

// 将选中的字段添加为列
function addSelectedFieldsAsColumns() {
  if (!currentElement.value || currentElement.value.type !== 'table') return;
  
  emit('save-state');
  
  const columnWidth = 160;
  const tableElement = currentElement.value as any;
  
  // Ensure columns array exists
  if (!tableElement.columns) {
    tableElement.columns = [];
  }
  
  // Get existing columns and their field names
  const existingColumns = [...tableElement.columns];
  const existingFieldMap = new Map<string, any>();
  
  // Populate existing field map
  existingColumns.forEach(column => {
    if (column.detailCell?.expression) {
      const match = column.detailCell.expression.match(/\$F\{([^}]+)\}/);
      if (match) {
        const fieldName = match[1];
        existingFieldMap.set(fieldName, column);
      }
    }
  });
  
  // Prepare new columns array
  const newColumns: any[] = [];
  
  // Add columns for selected fields
  selectedFields.value.forEach(fieldName => {
    // Check if field already has a column
    if (existingFieldMap.has(fieldName)) {
      // Keep existing column
      newColumns.push(existingFieldMap.get(fieldName));
      // Remove from map to track which fields are still used
      existingFieldMap.delete(fieldName);
    } else {
      // Create new column for new field
      const newColumn: any = {
        uuid: crypto.randomUUID(),
        width: columnWidth,
        name: fieldName,
        tableHeader: {
          type: 'staticText',
          x: 0,
          y: 0,
          width: columnWidth,
          height: 30,
          text: fieldName,
          forecolor: '#006699',
          backcolor: '#E6E6E6',
          fontFamily: 'SansSerif',
          fontSize: 19,
          isBold: true
        },
        columnHeader: {
          type: 'staticText',
          x: 0,
          y: 0,
          width: columnWidth,
          height: 30,
          text: fieldName
        },
        detailCell: {
          type: 'textField',
          x: 0,
          y: 0,
          width: columnWidth,
          height: 30,
          expression: `$F{${fieldName}}`
        },
        tableFooter: {
          type: 'textField',
          x: 0,
          y: 0,
          width: columnWidth,
          height: 30,
          expression: ''
        },
        columnFooter: {
          type: 'textField',
          x: 0,
          y: 0,
          width: columnWidth,
          height: 30,
          expression: ''
        }
      };
      
      newColumns.push(newColumn);
    }
  });
  
  // Update table columns
  tableElement.columns = newColumns;
  
  showFieldSelectionModal.value = false;
  selectedFields.value = [];
  emit('update-jrxml');
}

// 拖拽排序相关
let draggedIndex: number | null = null;

function onDragStart(event: DragEvent, index: number) {
  draggedIndex = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', index.toString());
  }
}

function onDragOver(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
}

function onDrop(event: DragEvent, dropIndex: number) {
  event.preventDefault();
  if (draggedIndex === null || draggedIndex === dropIndex || !currentElement.value || currentElement.value.type !== 'table') {
    draggedIndex = null;
    return;
  }
  
  emit('save-state');
  
  const tableElement = currentElement.value as any;
  if (!tableElement.columns) {
    draggedIndex = null;
    return;
  }
  
  // 执行拖拽排序
  const columns = [...tableElement.columns];
  const draggedColumn = columns[draggedIndex];
  if (draggedColumn) {
    columns.splice(draggedIndex, 1);
    columns.splice(dropIndex, 0, draggedColumn);
    tableElement.columns = columns;
  }
  
  emit('update-jrxml');
  draggedIndex = null;
}

// 表格列操作方法
function addTableColumn() {
  if (!currentElement.value || currentElement.value.type !== 'table') return;
  
  emit('save-state');
  
  const columnWidth = 160;
  const newColumn: any = {
    uuid: crypto.randomUUID(),
    width: columnWidth,
    name: `Column${currentElement.value.columns.length + 1}`,
    tableHeader: {
      type: 'staticText',
      x: 0,
      y: 0,
      width: columnWidth,
      height: 30,
      text: '',
      forecolor: '#006699',
      backcolor: '#E6E6E6',
      fontFamily: 'SansSerif',
      fontSize: 19,
      isBold: true
    },
    columnHeader: {
      type: 'staticText',
      x: 0,
      y: 0,
      width: columnWidth,
      height: 30,
      text: `New Column`
    },
    detailCell: {
      type: 'textField',
      x: 0,
      y: 0,
      width: columnWidth,
      height: 30,
      expression: '$F{NEW_FIELD}'
    },
    tableFooter: {
      type: 'textField',
      x: 0,
      y: 0,
      width: columnWidth,
      height: 30,
      expression: ''
    },
    columnFooter: {
      type: 'textField',
      x: 0,
      y: 0,
      width: columnWidth,
      height: 30,
      expression: ''
    }
  };
  
  if (!currentElement.value.columns) {
    currentElement.value.columns = [];
  }
  
  currentElement.value.columns.push(newColumn);
  emit('update-jrxml');
}

function removeTableColumn(index: number) {
  if (!currentElement.value || currentElement.value.type !== 'table' || !currentElement.value.columns) return;
  
  if (currentElement.value.columns.length <= 1) {
    // 至少保留一列
    return;
  }
  
  emit('save-state');
  currentElement.value.columns.splice(index, 1);
  emit('update-jrxml');
}

// 通过控件更新背景颜色
function updateBackcolorFromControls() {
  if (!currentElement.value) return;
  
  // 确保 tempColor 有效
  if (!tempColor.value) {
    tempColor.value = '#ffffff';
  }
  
  if (tempOpacity.value >= 1) {
    // 完全不透明，使用 hex
    currentElement.value.backcolor = tempColor.value;
  } else {
    // 半透明，使用 rgba
    // Hex 转 RGB
    let hex = tempColor.value;
    if (hex.startsWith('#')) hex = hex.slice(1);
    
    // 处理简写 hex (e.g. #fff)
    if (hex.length === 3) {
      hex = hex[0]! + hex[0]! + hex[1]! + hex[1]! + hex[2]! + hex[2]!;
    }
    
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    
    // 保留4位小数
    const alpha = Math.round(tempOpacity.value * 10000) / 10000;
    currentElement.value.backcolor = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  onBackcolorChange();
}

// 背景颜色变更处理
function onBackcolorChange() {
  if (currentElement.value) {
    // 如果设置了背景色，自动设置为不透明，确保颜色可见
    if (!currentElement.value.mode || currentElement.value.mode === 'Transparent') {
      currentElement.value.mode = 'Opaque';
    }
    emit('save-state');
    emit('update-jrxml');
  }
}

// 删除元素
function deleteElement() {
  emit('delete-element');
}

// 矩形边框相关辅助函数
function getRectangleBorderWidth(): number {
  const el = currentElement.value as any;
  if (!el?.pen) return 1;
  return el.pen.lineWidth || 0;
}

function setRectangleBorderWidth(value: string) {
  if (!currentElement.value) return;
  const el = currentElement.value as any;
  const numValue = parseFloat(value) || 0;
  emit('save-state');
  if (!el.pen) {
    el.pen = {};
  }
  el.pen.lineWidth = numValue;
  emit('update-jrxml');
}

function getRectangleBorderStyle(): string {
  const el = currentElement.value as any;
  if (!el?.pen) return 'Solid';
  return el.pen.lineStyle || 'Solid';
}

function setRectangleBorderStyle(value: string) {
  if (!currentElement.value) return;
  const el = currentElement.value as any;
  emit('save-state');
  if (!el.pen) {
    el.pen = {};
  }
  el.pen.lineStyle = value;
  emit('update-jrxml');
}

function getRectangleBorderColor(): string {
  const el = currentElement.value as any;
  if (!el?.pen) return '#000000';
  return el.pen.lineColor || '#000000';
}

function setRectangleBorderColor(value: string) {
  if (!currentElement.value) return;
  const el = currentElement.value as any;
  emit('save-state');
  if (!el.pen) {
    el.pen = {};
  }
  el.pen.lineColor = value;
  emit('update-jrxml');
}
</script>

<style scoped>
.element-properties {
  padding: 16px;
}

.element-properties h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.element-properties h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.element-properties h5 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #999;
}

.property-section {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.basic-properties-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.basic-properties-grid .form-group {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.form-group small {
  display: block;
  margin-top: 4px;
  font-size: 10px;
  color: #999;
}

.band-heights-grid {
  display: grid;
  gap: 8px;
}

.band-height-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.band-height-control {
  display: flex;
  align-items: center;
  gap: 4px;
}

.band-height-input {
  width: 80px;
}

.band-height-unit {
  font-size: 12px;
  color: #999;
}

.box-section {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.border-quick-actions {
  display: flex;
  gap: 8px;
}



.border-side-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.side-label {
  width: 40px;
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.side-control {
  flex: 1;
  min-width: 100px;
}

.width-control {
  width: 80px;
}

.color-control {
  width: 60px;
  height: 28px;
  padding: 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.padding-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.checkbox-group {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  width: auto;
}

.alignment-controls {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}



.element-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}



.font-hint {
  display: block;
  margin-top: 4px;
  font-size: 10px;
  color: #999;
}

/* 表格属性样式 */
.table-columns-list {
  margin: 8px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  background-color: #f9f9f9;
}

.table-column-item {
  margin-bottom: 8px;
  padding: 8px;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.table-column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: bold;
}



.table-column-properties {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.form-group.small {
  flex: 1;
  min-width: 120px;
}

.form-group.small.full-width {
  width: 100%;
  flex-basis: 100%;
  margin-top: 8px;
}

.small-input {
  width: 100%;
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid #ddd;
  border-radius: 3px;
}

.table-column-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

/* 拖拽排序样式 */
.table-column-item {
  transition: all 0.2s;
  cursor: move;
}

.table-column-item.dragging {
  opacity: 0.5;
}

.table-column-item.drag-over {
  border: 2px dashed #1890ff;
}

.drag-handle {
  cursor: move;
  color: #999;
  margin-right: 8px;
  user-select: none;
  font-size: 14px;
  font-weight: bold;
}

.drag-handle:hover {
  color: #1890ff;
}

.table-column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}





.field-selection-content {
  display: flex;
  gap: 20px;
  height: 400px;
}

.available-fields, .selected-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.available-fields h4, .selected-fields h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.fields-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #fafafa;
  padding: 8px;
}

.field-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.field-item:hover {
  background-color: #f5f5f5;
  border-color: #1890ff;
}

.field-item.selected {
  background-color: #e6f7ff;
  border-color: #91d5ff;
}

.field-item input[type="checkbox"] {
  margin-right: 8px;
}

.field-name {
  flex: 1;
  font-size: 12px;
  font-weight: 500;
}

.field-type {
  font-size: 11px;
  color: #999;
  margin-left: 8px;
}


</style>
