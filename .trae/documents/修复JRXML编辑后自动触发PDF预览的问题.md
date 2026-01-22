1. 修改PdfPreviewModal.vue组件，将previewUrl从计算属性改为响应式变量
2. 添加watch监听器，只在visible变为true时（即用户点击预览按钮后）才生成previewUrl
3. 移除iframe的自动提交逻辑，改为手动触发或只在组件可见时生成预览URL
4. 确保只有在用户明确点击"预览PDF"按钮时才会向预览服务器发送请求

