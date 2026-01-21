<template>
  <BaseModal
    :visible="visible"
    :title="'JRXML Visual Designer User Guide'"
    :showFooter="false"
    @update:visible="$emit('update:visible', $event)"
    @cancel="closeModal"
    :contentClass="'help-modal-content'"
  >
    <div class="help-content-scroll">
      <h4>1. Template Design Basics</h4>
      <p>This tool is used to visually design PDF report templates for JasperReports, allowing you to quickly create professional PDF reports through drag-and-drop functionality.</p>
      
      <h4>2. Operation Steps</h4>
      <ol>
        <li><strong>Modify Existing JRXML</strong>: Open the bottom panel, copy the current JRXML to the code area, then click Apply</li>
        <li><strong>Add Elements</strong>: Drag elements from the left element library to the design area</li>
        <li><strong>Adjust Layout</strong>: Drag elements to adjust position, drag the bottom-right corner to resize</li>
        <li><strong>Set Properties</strong>: After selecting an element, set properties in the right panel</li>
        <li><strong>Configure Data</strong>: Add report parameters and data fields in the left panel</li>
        <li><strong>Generate JRXML</strong>: Click the "Generate JRXML" button to export the report template</li>
      </ol>
      
      <h4>3. Supported Element Types</h4>
      <ul>
        <li>Static Text: Display fixed text content</li>
        <li>Text Field: Display dynamic data fields</li>
        <li>Image: Insert image elements</li>
        <li>Line: Add separator lines</li>
        <li>Rectangle: Add borders or background blocks</li>
      </ul>
      
      <h4>4. Keyboard Shortcuts</h4>
      <ul>
        <li><strong>Ctrl+S (Mac: Cmd+S)</strong>: Save current file</li>
        <li><strong>Ctrl+B (Mac: Cmd+B)</strong>: Toggle bottom JRXML panel display</li>
        <li><strong>Ctrl+Z (Mac: Cmd+Z)</strong>: Undo operation</li>
        <li><strong>Ctrl+Y (Mac: Cmd+Y)</strong>: Redo operation</li>
        <li><strong>Ctrl+C (Mac: Cmd+C)</strong>: Copy selected element or text</li>
        <li><strong>Ctrl+V (Mac: Cmd+V)</strong>: Paste element or text</li>
        <li><strong>Delete/Backspace</strong>: Delete selected element (non-editing mode)</li>
        <li><strong>Arrow Keys</strong>: Select surrounding elements</li>
        <li><strong>Shift+Arrow Keys</strong>: Fine-tune selected element position (moves 1 pixel at a time)</li>
      </ul>
      
      <h4>5. Advanced Features</h4>
      <ul>
        <li><strong>Automatic Data Field Creation</strong>: When referencing a non-existent field in a dynamic text element expression (like $F{abc}), the system will automatically create that data field</li>
        <li><strong>Report Element Deletion</strong>: In the left report elements list, each element has a delete button on the right, click to delete the corresponding element</li>
        <li><strong>Cross-platform Shortcuts</strong>: Supports using Command key on macOS instead of Ctrl key on Windows as shortcuts</li>
      </ul>
      
      <h4>6. Notes</h4>
      <ul>
        <li>Elements cannot exceed the paper boundary</li>
        <li>Press Enter to confirm, Esc to cancel when editing text</li>
        <li>Double-click a static text box to pop up an input box to modify text content</li>
        <li>Double-click a dynamic text box to pop up an input box to modify expression content</li>
        <li>JRXML will not be updated in real-time when dragging elements, it will be updated after releasing the mouse</li>
        <li>All modifications will be automatically saved to local storage</li>
      </ul>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from './BaseModal.vue';

// Define props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

// Define emits
const emit = defineEmits(['update:visible']);

// Close modal
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