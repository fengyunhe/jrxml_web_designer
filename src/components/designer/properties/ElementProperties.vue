<template>
  <div class="element-properties">
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
          <div class="basic-properties-grid">
            <div class="form-group">
              <label>X坐标</label>
              <input v-if="currentElement" v-model.number="currentElement.x" type="number" @change="ensureIntegerValue(currentElement, 'x')" />
            </div>
            <div class="form-group">
              <label>Y坐标</label>
              <input v-if="currentElement" v-model.number="currentElement.y" type="number" @change="ensureIntegerValue(currentElement, 'y')" />
            </div>
            <div class="form-group">
              <label>宽度</label>
              <input v-if="currentElement" v-model.number="currentElement.width" type="number" @change="ensureIntegerValue(currentElement, 'width')" />
            </div>
            <div class="form-group">
              <label>高度</label>
              <input v-if="currentElement" v-model.number="currentElement.height" type="number" @change="ensureIntegerValue(currentElement, 'height')" />
            </div>
          </div>
          
          <!-- 根据元素类型显示特定属性 -->
          <template v-if="currentElement.type === 'staticText'">
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
            <div class="form-group" v-if="currentElement && currentElement.type === 'textField'">
              <label>表达式</label>
              <input v-if="currentElement" :value="getTextFieldExpression(currentElement)" @input="updateTextFieldExpression" type="text" />
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
            <div class="checkbox-group">
              <label>
                <input v-if="currentElement" v-model="currentElement.isStretchWithOverflow" type="checkbox" />
                内容超出时自动拉伸
              </label>
            </div>
            <div class="checkbox-group">
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
          
          <template v-else-if="currentElement && currentElement.type === 'image'">
            <div class="form-group">
              <label>图片表达式</label>
              <input v-if="currentElement" v-model="currentElement.imageExpression" type="text" />
              <small>例如: "logo.png" 或 $F{imageFieldName}</small>
            </div>
          </template>
          <template v-else-if="currentElement && currentElement.type === 'rectangle'">
            <div class="form-group">
              <label>圆角半径</label>
              <input v-if="currentElement" v-model.number="currentElement.radius" type="number" min="0" @change="ensureIntegerValue(currentElement, 'radius')" />
            </div>
          </template>
          <template v-else-if="currentElement && currentElement.type === 'break'">
            <div class="form-group">
              <label>分页符类型</label>
              <select v-if="currentElement" v-model="currentElement.breakType" @change="emit('update-jrxml')">
                <option value="Page">分页 (Page Break)</option>
                <option value="Column">分栏 (Column Break)</option>
              </select>
            </div>
          </template>
          <template v-else-if="currentElement && currentElement.type === 'frame'">
            <div class="form-group">
              <label>布局模式</label>
              <select v-if="currentElement" v-model="currentElement.layout" @change="emit('update-jrxml')">
                <option :value="undefined">自由布局 (Free Layout)</option>
                <option value="HorizontalLayout">水平布局 (Horizontal Layout)</option>
                <option value="VerticalLayout">垂直布局 (Vertical Layout)</option>
              </select>
            </div>
          </template>
        </div>
        
        <!-- 边框设置标签页 -->
        <div class="element-tab-content" v-show="activeElementTab === 'box'">
          <template v-if="currentElement && currentElement.type === 'break'">
            <div class="box-section">
              <p style="font-size: 12px; color: #666;">分页符元素不支持边框设置。</p>
            </div>
          </template>
          <template v-else>
            <h4>边框设置</h4>
            
            <!-- 矩形/椭圆元素的边框设置 (统一设置) -->
            <template v-if="currentElement && (currentElement.type === 'rectangle' || currentElement.type === 'ellipse')">
              <div class="box-section">
                <h5>统一边框设置</h5>
                <p style="font-size: 12px; color: #666; margin-bottom: 12px;">该元素只支持统一设置边框</p>
                
                <div class="border-side-group">
                  <label class="side-label">样式</label>
                  <select :value="getRectangleBorderStyle()" @change="setRectangleBorderStyle(($event.target as HTMLSelectElement).value)" class="side-control">
                    <option value="">无</option>
                    <option value="Solid">实线</option>
                    <option value="Dashed">虚线</option>
                    <option value="Dotted">点线</option>
                    <option value="Double">双线</option>
                  </select>
                </div>
                
                <div class="border-side-group">
                  <label class="side-label">宽度</label>
                  <input :value="getRectangleBorderWidth()" @input="setRectangleBorderWidth(($event.target as HTMLInputElement).value)" type="number" min="0" max="10" step="0.5" class="side-control" placeholder="宽度" />
                </div>
                
                <div class="border-side-group">
                  <label class="side-label">颜色</label>
                  <input :value="getRectangleBorderColor()" @input="setRectangleBorderColor(($event.target as HTMLInputElement).value)" type="color" class="color-control" style="flex: 1;" />
                </div>
              </div>
            </template>
            
            <!-- 其他元素的边框设置 (支持各边独立设置) -->
            <template v-else>
              <!-- 快捷边框设置 -->
              <div class="box-section">
                <h5>快捷设置</h5>
                <div class="border-quick-actions">
                  <button @click="removeAllBorders" class="btn-remove-border">四面无边框</button>
                  <button @click="addSolidBorder" class="btn-add-border">四面实线边框(1px)</button>
                </div>
              </div>
              
              <!-- 各边边框设置 -->
              <div class="box-section">
                <h5>各边边框设置</h5>
                
                <!-- 上边 -->
                <div class="border-side-group">
                  <label class="side-label">上边</label>
                  <select v-if="currentElement && currentElement.box" :value="getSideBorderStyle('top')" @change="setSideBorderStyle('top', ($event.target as HTMLSelectElement).value)" class="side-control">
                    <option value="">无</option>
                    <option value="Solid">实线</option>
                    <option value="Dashed">虚线</option>
                    <option value="Dotted">点线</option>
                    <option value="Double">双线</option>
                  </select>
                  <input v-if="currentElement && currentElement.box" :value="getSideBorderWidth('top')" @input="setSideBorderWidth('top', ($event.target as HTMLInputElement).value)" type="number" min="0" max="10" step="0.5" class="width-control" placeholder="宽度" />
                  <input v-if="currentElement && currentElement.box" :value="getSideBorderColor('top')" @input="setSideBorderColor('top', ($event.target as HTMLInputElement).value)" type="color" class="color-control" />
                </div>
                
                <!-- 左边 -->
                <div class="border-side-group">
                  <label class="side-label">左边</label>
                  <select v-if="currentElement && currentElement.box" :value="getSideBorderStyle('left')" @change="setSideBorderStyle('left', ($event.target as HTMLSelectElement).value)" class="side-control">
                    <option value="">无</option>
                    <option value="Solid">实线</option>
                    <option value="Dashed">虚线</option>
                    <option value="Dotted">点线</option>
                    <option value="Double">双线</option>
                  </select>
                  <input v-if="currentElement && currentElement.box" :value="getSideBorderWidth('left')" @input="setSideBorderWidth('left', ($event.target as HTMLInputElement).value)" type="number" min="0" max="10" step="0.5" class="width-control" placeholder="宽度" />
                  <input v-if="currentElement && currentElement.box" :value="getSideBorderColor('left')" @input="setSideBorderColor('left', ($event.target as HTMLInputElement).value)" type="color" class="color-control" />
                </div>
                
                <!-- 下边 -->
                <div class="border-side-group">
                  <label class="side-label">下边</label>
                  <select v-if="currentElement && currentElement.box" :value="getSideBorderStyle('bottom')" @change="setSideBorderStyle('bottom', ($event.target as HTMLSelectElement).value)" class="side-control">
                    <option value="">无</option>
                    <option value="Solid">实线</option>
                    <option value="Dashed">虚线</option>
                    <option value="Dotted">点线</option>
                    <option value="Double">双线</option>
                  </select>
                  <input v-if="currentElement && currentElement.box" :value="getSideBorderWidth('bottom')" @input="setSideBorderWidth('bottom', ($event.target as HTMLInputElement).value)" type="number" min="0" max="10" step="0.5" class="width-control" placeholder="宽度" />
                  <input v-if="currentElement && currentElement.box" :value="getSideBorderColor('bottom')" @input="setSideBorderColor('bottom', ($event.target as HTMLInputElement).value)" type="color" class="color-control" />
                </div>
                
                <!-- 右边 -->
                <div class="border-side-group">
                  <label class="side-label">右边</label>
                  <select v-if="currentElement && currentElement.box" :value="getSideBorderStyle('right')" @change="setSideBorderStyle('right', ($event.target as HTMLSelectElement).value)" class="side-control">
                    <option value="">无</option>
                    <option value="Solid">实线</option>
                    <option value="Dashed">虚线</option>
                    <option value="Dotted">点线</option>
                    <option value="Double">双线</option>
                  </select>
                  <input v-if="currentElement && currentElement.box" :value="getSideBorderWidth('right')" @input="setSideBorderWidth('right', ($event.target as HTMLInputElement).value)" type="number" min="0" max="10" step="0.5" class="width-control" placeholder="宽度" />
                  <input v-if="currentElement && currentElement.box" :value="getSideBorderColor('right')" @input="setSideBorderColor('right', ($event.target as HTMLInputElement).value)" type="color" class="color-control" />
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
            </template>
          </template>
        </div>
        
        <!-- 样式设置标签页 -->
        <div class="element-tab-content" v-show="activeElementTab === 'style'">
          <template v-if="currentElement && currentElement.type === 'break'">
            <div class="box-section">
              <p style="font-size: 12px; color: #666;">分页符元素不支持样式设置。</p>
            </div>
          </template>
          <template v-else>
            <h4>样式设置</h4>
            <div class="form-group">
              <label>背景颜色</label>
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
                <span style="font-size: 12px; color: #666; width: 40px;">透明度</span>
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
            <label>背景模式</label>
            <select v-if="currentElement" v-model="currentElement.mode" @change="emit('update-jrxml')">
              <option :value="undefined">默认(透明)</option>
              <option value="Transparent">透明</option>
              <option value="Opaque">不透明</option>
            </select>
          </div>
          
          <template v-if="currentElement && currentElement.type !== 'line' && currentElement.type !== 'image' && currentElement.type !== 'frame'">
            <div class="form-group">
              <label>字体名称</label>
              <select v-if="currentElement" v-model="currentElement.fontFamily" style="appearance: none; -webkit-appearance: none;">
                <option value="">使用默认字体</option>
                <option v-for="font in availableFonts" :key="font" :value="font">{{ font }}</option>
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
          </template>
        </div>
      </div>
      
      <div class="element-actions">
        <button @click="deleteElement" class="btn-danger">删除元素</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import type { Band, SelectedElementInfo } from '../../../types';
import { getAvailableFonts } from '../../../utils/fontUtils';

interface Props {
  selectedBandIndex: number | null;
  selectedElement: SelectedElementInfo | null;
  bands: Band[];
  reportProperties: any;
}

interface Emits {
  (e: 'update:bands', bands: Band[]): void;
  (e: 'delete-element'): void;
  (e: 'update-jrxml'): void;
  (e: 'save-state'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 标签页相关
const activeElementTab = ref('basic');
const elementTabs = ref([
  { id: 'basic', name: '基本属性' },
  { id: 'box', name: 'Box设置' },
  { id: 'style', name: '样式设置' }
]);

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
      return band.elements[props.selectedElement.elementIndex];
    }
  }
  return null;
});

// 获取Band显示名称
function getBandDisplayName(bandType: string): string {
  const bandNames: Record<string, string> = {
    'TITLE': '标题',
    'PAGE_HEADER': '页眉',
    'COLUMN_HEADER': '列标题',
    'DETAIL': '详细数据',
    'COLUMN_FOOTER': '列脚',
    'PAGE_FOOTER': '页脚',
    'SUMMARY': '汇总',
    'BACKGROUND': '背景',
    'LAST_PAGE_FOOTER': '末页页脚',
    'NO_DATA': '无数据'
  };
  return bandNames[bandType] || bandType;
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
    // 只有当 tempColor 为空或为默认值时才重置
    // 这样可以避免从空值切换到有值时闪烁
    if (!tempColor.value || tempColor.value === '#000000') {
      tempColor.value = '#ffffff';
      tempOpacity.value = 1;
    }
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
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
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
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      
      // RGB 转 Hex
      const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      tempColor.value = hex;
      tempOpacity.value = 1;
    }
  }
}, { immediate: true });

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
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
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
    // 如果设置了背景色但没有设置模式，自动设置为不透明
    if (!currentElement.value.mode) {
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
  if (!currentElement.value?.pen) return 0;
  return currentElement.value.pen.lineWidth || 0;
}

function setRectangleBorderWidth(value: string) {
  if (!currentElement.value) return;
  const numValue = parseFloat(value) || 0;
  emit('save-state');
  if (!currentElement.value.pen) {
    currentElement.value.pen = {};
  }
  currentElement.value.pen.lineWidth = numValue;
  emit('update-jrxml');
}

function getRectangleBorderStyle(): string {
  if (!currentElement.value?.pen) return '';
  return currentElement.value.pen.lineStyle || '';
}

function setRectangleBorderStyle(value: string) {
  if (!currentElement.value) return;
  emit('save-state');
  if (!currentElement.value.pen) {
    currentElement.value.pen = {};
  }
  currentElement.value.pen.lineStyle = value;
  emit('update-jrxml');
}

function getRectangleBorderColor(): string {
  if (!currentElement.value?.pen) return '#000000';
  return currentElement.value.pen.lineColor || '#000000';
}

function setRectangleBorderColor(value: string) {
  if (!currentElement.value) return;
  emit('save-state');
  if (!currentElement.value.pen) {
    currentElement.value.pen = {};
  }
  currentElement.value.pen.lineColor = value;
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

.element-tabs {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.element-tab-navigation {
  display: flex;
  border-bottom: 1px solid #ddd;
  background-color: #f9f9f9;
}

.element-tab-button {
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.element-tab-button:hover {
  color: #1890ff;
}

.element-tab-button.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
  background-color: white;
}

.element-tab-content {
  padding: 16px;
  background-color: white;
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

.btn-remove-border,
.btn-add-border {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.btn-remove-border {
  background-color: #ff4d4f;
  color: white;
}

.btn-remove-border:hover {
  background-color: #ff7875;
}

.btn-add-border {
  background-color: #52c41a;
  color: white;
}

.btn-add-border:hover {
  background-color: #73d13d;
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

.align-button {
  padding: 4px 8px;
  border: 1px solid #ddd;
  background-color: white;
  cursor: pointer;
  font-size: 12px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.align-button:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.align-button.active {
  background-color: #1890ff;
  border-color: #1890ff;
  color: white;
}

.element-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.btn-danger {
  padding: 8px 16px;
  border: 1px solid #ff4d4f;
  background-color: #ff4d4f;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.btn-danger:hover {
  background-color: #ff7875;
  border-color: #ff7875;
}

.font-hint {
  display: block;
  margin-top: 4px;
  font-size: 10px;
  color: #999;
}
</style>
