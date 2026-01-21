<template>
  <BaseModal
    :visible="visible"
    :title="'PDF模板设计器使用说明'"
    :showFooter="false"
    @update:visible="$emit('update:visible', $event)"
    @cancel="closeModal"
    :contentClass="'help-modal-content'"
  >
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
        <li><strong>Ctrl+S (Mac: Cmd+S)</strong>：保存当前文件</li>
        <li><strong>Ctrl+B (Mac: Cmd+B)</strong>：切换底部JRXML面板显示</li>
        <li><strong>Ctrl+Z (Mac: Cmd+Z)</strong>：撤销操作</li>
        <li><strong>Ctrl+Y (Mac: Cmd+Y)</strong>：重做操作</li>
        <li><strong>Ctrl+C (Mac: Cmd+C)</strong>：复制选中元素或文本</li>
        <li><strong>Ctrl+V (Mac: Cmd+V)</strong>：粘贴元素或文本</li>
        <li><strong>Delete/Backspace</strong>：删除选中元素（非编辑模式）</li>
        <li><strong>方向键</strong>：选择周围元素</li>
        <li><strong>Shift+方向键</strong>：微调选中元素的位置（每次移动1像素）</li>
      </ul>
      
      <h4>5. 高级功能</h4>
      <ul>
        <li><strong>自动数据字段创建</strong>：在动态文本元素表达式中引用不存在的字段（如$F{abc}）时，系统会自动创建该数据字段</li>
        <li><strong>报表元素删除</strong>：在左侧报表元素列表中，每个元素右侧都有删除按钮，点击即可删除对应元素</li>
        <li><strong>跨平台快捷键</strong>：支持在macOS上使用Command键替代Windows上的Ctrl键作为快捷键</li>
      </ul>
      
      <h4>6. 注意事项</h4>
      <ul>
        <li>元素不能超出纸张边界</li>
        <li>编辑文本时按Enter确认，Esc取消</li>
        <li>双击静态文本框可以弹出输入框修改文本内容</li>
        <li>双击动态文本框可以弹出输入框修改表达式内容</li>
        <li>拖动元素时不会实时更新JRXML，释放鼠标后才会更新</li>
        <li>所有修改会自动保存到本地存储</li>
      </ul>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from './BaseModal.vue';

// 定义props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

// 定义emits
const emit = defineEmits(['update:visible']);

// 关闭弹窗
const closeModal = () => {
  emit('update:visible', false);
};
</script>

<style scoped>
/* Help Modal Specific Styles */
.help-modal-content {
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
}

:deep(.modal-body) {
  padding: 20px;
  overflow-y: auto;
}

.help-content-scroll {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
}

.help-content-scroll h4 {
  margin-top: 20px;
  margin-bottom: 10px;
  color: #444;
}

.help-content-scroll p {
  color: #666;
  margin-bottom: 10px;
  line-height: 1.6;
}

.help-content-scroll ol,
.help-content-scroll ul {
  color: #666;
  margin-bottom: 15px;
  padding-left: 25px;
}

.help-content-scroll li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.help-content-scroll strong {
  color: #333;
}
</style>