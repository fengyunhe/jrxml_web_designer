<template>
  <div class="codemirror-wrapper">
    <!-- 编辑器工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <span class="toolbar-info">XML Editor</span>
      </div>
      <div class="toolbar-right">
        <button class="toolbar-btn" @click="toggleSearch" title="搜索 (Ctrl+F)">
          <span class="search-icon">🔍</span>
          搜索
        </button>
      </div>
    </div>
    
    <!-- 搜索栏 -->
    <div v-if="showSearch" class="search-bar">
      <input 
        ref="searchInput" 
        v-model="searchQuery" 
        class="search-input" 
        placeholder="搜索... (Ctrl+F)"
        @input="performSearch"
        @keydown.enter="findNext"
        @keydown.shift.enter="findPrevious"
        @keydown.escape="closeSearch"
      />
      <div class="search-controls">
        <button class="search-btn" @click="findPrevious" title="上一个">↑</button>
        <button class="search-btn" @click="findNext" title="下一个">↓</button>
        <button class="search-btn" @click="closeSearch" title="关闭">×</button>
      </div>
      <div v-if="searchResultsCount > 0" class="search-status">
        {{ currentSearchResult }} / {{ searchResultsCount }}
      </div>
    </div>
    <div ref="editorContainer" class="codemirror-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { EditorState } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { lineNumbers, keymap, highlightActiveLine, highlightActiveLineGutter, gutter } from '@codemirror/view';
import { xml } from '@codemirror/lang-xml';
import { syntaxHighlighting, defaultHighlightStyle, foldGutter, indentOnInput } from '@codemirror/language';
import type { EditorStateConfig } from '@codemirror/state';
import { defaultKeymap } from '@codemirror/commands';

// 定义组件属性
interface Props {
  modelValue: string;
  placeholder?: string;
  readOnly?: boolean;
}

// 定义组件事件
interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'scroll'): void;
}

// 使用defineProps和defineEmits
const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  readOnly: false
});

const emit = defineEmits<Emits>();

// 引用
const editorContainer = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);
let editorView: EditorView | null = null;

// 搜索相关状态
const showSearch = ref(false);
const searchQuery = ref('');
const searchResultsCount = ref(0);
const currentSearchResult = ref(0);
let searchResults: { from: number; to: number }[] = [];
let currentSearchIndex = 0;

// 创建编辑器
const createEditor = () => {
  if (!editorContainer.value) return;
  
  // 编辑器配置
  const config: EditorStateConfig = {
    doc: props.modelValue,
    extensions: [
      lineNumbers(),
      foldGutter(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      syntaxHighlighting(defaultHighlightStyle),
      xml(),
      keymap.of([
        ...defaultKeymap,
        {
          key: 'Ctrl-F',
          run: () => {
            toggleSearch();
            return true;
          }
        }
      ]),
      indentOnInput(),
      EditorState.readOnly.of(props.readOnly),
      EditorView.updateListener.of(update => {
        if (update.docChanged) {
          emit('update:modelValue', update.state.doc.toString());
        }
      }),
      EditorView.lineWrapping,
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: '14px',
          fontFamily: '"Consolas", "Monaco", "Courier New", monospace'
        },
        '.cm-scroller': {
          overflow: 'auto'
        },
        '.cm-gutters': {
          backgroundColor: '#f0f0f0',
          borderRight: '1px solid #ddd'
        },
        '.cm-activeLine': {
          backgroundColor: 'rgba(74, 144, 226, 0.1)'
        },
        '.cm-focused .cm-selectionBackground': {
          backgroundColor: 'rgba(74, 144, 226, 0.3)'
        },
        '.cm-search-match': {
          backgroundColor: 'rgba(255, 255, 0, 0.4)',
          outline: '1px solid #ffcc00'
        },
        '.cm-search-match-selected': {
          backgroundColor: 'rgba(255, 204, 0, 0.6)',
          outline: '1px solid #ff9900'
        },
        '.cm-foldGutter': {
          width: '20px'
        },
        '.cm-foldGutter-folded, .cm-foldGutter-open': {
          cursor: 'pointer'
        }
      })
    ],
  };
  
  // 创建编辑器视图
  editorView = new EditorView({
    state: EditorState.create(config),
    parent: editorContainer.value
  });
};

// 更新编辑器内容
const updateEditorContent = (content: string) => {
  if (editorView && editorView.state.doc.toString() !== content) {
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: content
      }
    });
  }
};

// 监听modelValue变化
watch(() => props.modelValue, (newValue) => {
  updateEditorContent(newValue);
});

// 监听readOnly变化
watch(() => props.readOnly, (newValue) => {
  if (editorView) {
    // 重新创建编辑器状态以更新readOnly属性
    const newState = EditorState.create({
      doc: editorView.state.doc,
      extensions: [
        lineNumbers(),
        foldGutter(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        syntaxHighlighting(defaultHighlightStyle),
        xml(),
        keymap.of([
          ...defaultKeymap,
          {
            key: 'Ctrl-F',
            run: () => {
              toggleSearch();
              return true;
            }
          }
        ]),
        indentOnInput(),
        EditorState.readOnly.of(newValue),
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            emit('update:modelValue', update.state.doc.toString());
          }
        }),
        EditorView.lineWrapping,
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
            fontFamily: '"Consolas", "Monaco", "Courier New", monospace'
          },
          '.cm-scroller': {
            overflow: 'auto'
          },
          '.cm-gutters': {
            backgroundColor: '#f0f0f0',
            borderRight: '1px solid #ddd'
          },
          '.cm-activeLine': {
            backgroundColor: 'rgba(74, 144, 226, 0.1)'
          },
          '.cm-focused .cm-selectionBackground': {
            backgroundColor: 'rgba(74, 144, 226, 0.3)'
          },
          '.cm-search-match': {
            backgroundColor: 'rgba(255, 255, 0, 0.4)',
            outline: '1px solid #ffcc00'
          },
          '.cm-search-match-selected': {
            backgroundColor: 'rgba(255, 204, 0, 0.6)',
            outline: '1px solid #ff9900'
          },
          '.cm-foldGutter': {
            width: '20px'
          },
          '.cm-foldGutter-folded, .cm-foldGutter-open': {
            cursor: 'pointer'
          }
        })
      ]
    });
    
    editorView.setState(newState);
  }
});

// 组件挂载时创建编辑器
onMounted(() => {
  createEditor();
});

// 组件卸载前销毁编辑器
onBeforeUnmount(() => {
  if (editorView) {
    editorView.destroy();
    editorView = null;
  }
});

// 搜索相关方法
const toggleSearch = () => {
  showSearch.value = !showSearch.value;
  if (showSearch.value) {
    // 延迟聚焦搜索输入框，确保DOM已更新
    setTimeout(() => {
      searchInput.value?.focus();
    }, 100);
  }
};

const performSearch = () => {
  if (!editorView) return;
  
  const query = searchQuery.value;
  if (!query) {
    clearSearchHighlights();
    searchResultsCount.value = 0;
    currentSearchResult.value = 0;
    searchResults = [];
    currentSearchIndex = 0;
    return;
  }
  
  // 执行搜索
  searchResults = [];
  const doc = editorView.state.doc;
  const text = doc.toString();
  let index = 0;
  
  while ((index = text.indexOf(query, index)) !== -1) {
    const result = {
      from: index,
      to: index + query.length
    };
    searchResults.push(result);
    index += query.length;
  }
  
  // 更新搜索结果计数
  searchResultsCount.value = searchResults.length;
  currentSearchIndex = 0;
  currentSearchResult.value = searchResults.length > 0 ? 1 : 0;
  
  // 滚动到第一个匹配项
  if (searchResults.length > 0) {
    scrollToResult(currentSearchIndex);
  }
};

const findNext = () => {
  if (!editorView || searchResults.length === 0) return;
  
  currentSearchIndex = (currentSearchIndex + 1) % searchResults.length;
  currentSearchResult.value = currentSearchIndex + 1;
  scrollToResult(currentSearchIndex);
};

const findPrevious = () => {
  if (!editorView || searchResults.length === 0) return;
  
  currentSearchIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
  currentSearchResult.value = currentSearchIndex + 1;
  scrollToResult(currentSearchIndex);
};

const closeSearch = () => {
  showSearch.value = false;
  clearSearchHighlights();
  searchResultsCount.value = 0;
  currentSearchResult.value = 0;
  searchResults = [];
  currentSearchIndex = 0;
};

const clearSearchHighlights = () => {
  if (!editorView) return;
  
  // 重置选择
  editorView.dispatch({
    selection: { anchor: 0, head: 0 }
  });
};

const scrollToResult = (index: number) => {
  if (!editorView || index < 0 || index >= searchResults.length) return;
  
  const result = searchResults[index];
  if (result) {
    editorView.dispatch({
      selection: { anchor: result.from, head: result.to }
    });
    
    // 滚动到结果位置
    editorView.dispatch({
      effects: EditorView.scrollIntoView(result.from, {
        yMargin: 50,
        xMargin: 10
      })
    });
  }
};

// 跳转到指定行
const jumpToLine = (line: number, column: number) => {
  if (!editorView) return;
  
  const doc = editorView.state.doc;
  const lineInfo = doc.line(line);
  
  if (lineInfo) {
    const position = lineInfo.from + (column - 1);
    
    editorView.dispatch({
      selection: { anchor: position, head: position }
    });
    
    editorView.dispatch({
      effects: EditorView.scrollIntoView(position, {
        yMargin: 50,
        xMargin: 10
      })
    });
    
    editorView.focus();
  }
};

// 暴露方法给父组件
defineExpose({
  // 聚焦编辑器
  focus: () => {
    editorView?.focus();
  },
  
  // 获取编辑器实例
  getEditor: () => editorView,
  
  // 打开搜索栏
  openSearch: toggleSearch,
  
  // 跳转到指定行
  jumpToLine
});
</script>

<style scoped>
.codemirror-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  border: 1px solid #ddd;
  overflow: hidden;
}

/* 编辑器工具栏 */
.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #ddd;
  font-size: 14px;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-info {
  color: #666;
  font-size: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  background-color: #f0f0f0;
  border-color: #4a90e2;
  color: #4a90e2;
}

.search-icon {
  font-size: 12px;
}

.search-bar {
  display: flex;
  align-items: center;
  padding: 8px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #ddd;
  gap: 8px;
}

.search-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.search-input:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.search-controls {
  display: flex;
  gap: 4px;
}

.search-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #666;
}

.search-btn:hover {
  background-color: #f0f0f0;
  border-color: #4a90e2;
  color: #4a90e2;
}

.search-status {
  font-size: 12px;
  color: #666;
  margin-left: 8px;
}

.codemirror-container {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 确保CodeMirror样式正确应用 */
:deep(.cm-editor) {
  height: 100%;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
}

:deep(.cm-scroller) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
}

:deep(.cm-gutters) {
  background-color: #f0f0f0;
  border-right: 1px solid #ddd;
}

:deep(.cm-activeLineGutter) {
  background-color: #e8f4f8;
}

:deep(.cm-activeLine) {
  background-color: rgba(74, 144, 226, 0.1);
}

:deep(.cm-focused .cm-selectionBackground) {
  background-color: rgba(74, 144, 226, 0.3);
}

:deep(.cm-cursor) {
  border-left-color: #333;
}

/* XML语法高亮样式 */
:deep(.cm-tag) {
  color: #881280;
}

:deep(.cm-attribute) {
  color: #1f7199;
}

:deep(.cm-string) {
  color: #881280;
}

:deep(.cm-comment) {
  color: #a0a1a7;
  font-style: italic;
}

:deep(.cm-namespace) {
  color: #1f7199;
}

:deep(.cm-punctuation) {
  color: #333;
}

:deep(.cm-xml-error) {
  color: #f44747;
  text-decoration: wavy underline;
}
</style>
