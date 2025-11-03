// 元素相关的常量

// 元素类型配置
export const ELEMENT_TYPE_CONFIG = {
  staticText: {
    name: '静态文本',
    icon: '📝',
    defaultWidth: 100,
    defaultHeight: 30,
    defaultProps: {
      text: '静态文本',
    },
  },
  textField: {
    name: '文本字段',
    icon: '📄',
    defaultWidth: 100,
    defaultHeight: 30,
    defaultProps: {
      textFieldExpression: '$F{field}',
    },
  },
  image: {
    name: '图片',
    icon: '🖼️',
    defaultWidth: 100,
    defaultHeight: 100,
    defaultProps: {
      imageExpression: '$P{image}',
    },
  },
  line: {
    name: '线条',
    icon: '➖',
    defaultWidth: 100,
    defaultHeight: 1,
    defaultProps: {
      direction: 'TopDown',
    },
  },
  rectangle: {
    name: '矩形',
    icon: '⬜',
    defaultWidth: 100,
    defaultHeight: 50,
    defaultProps: {
      radius: 0,
    },
  },
};

// 元素库列表
export const ELEMENT_LIBRARY = [
  {
    type: 'staticText',
    name: '静态文本',
    icon: '📝',
    description: '显示固定文本内容',
  },
  {
    type: 'textField',
    name: '文本字段',
    icon: '📄',
    description: '显示动态数据字段',
  },
  {
    type: 'image',
    name: '图片',
    icon: '🖼️',
    description: '显示图片内容',
  },
  {
    type: 'line',
    name: '线条',
    icon: '➖',
    description: '绘制直线',
  },
  {
    type: 'rectangle',
    name: '矩形',
    icon: '⬜',
    description: '绘制矩形框',
  },
];

// 元素样式选项
export const ELEMENT_STYLE_OPTIONS = {
  // 字体名称选项
  fontNames: [
    { value: 'SansSerif', label: '无衬线字体' },
    { value: 'Serif', label: '衬线字体' },
    { value: 'Monospaced', label: '等宽字体' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Noto Serif SC', label: 'Noto Serif SC' },
  ],
  
  // 字体大小选项
  fontSizes: [
    { value: 8, label: '8px' },
    { value: 9, label: '9px' },
    { value: 10, label: '10px' },
    { value: 11, label: '11px' },
    { value: 12, label: '12px' },
    { value: 14, label: '14px' },
    { value: 16, label: '16px' },
    { value: 18, label: '18px' },
    { value: 20, label: '20px' },
    { value: 24, label: '24px' },
    { value: 28, label: '28px' },
    { value: 32, label: '32px' },
    { value: 36, label: '36px' },
    { value: 48, label: '48px' },
    { value: 64, label: '64px' },
    { value: 72, label: '72px' },
  ],
  
  // 文本对齐选项
  horizontalAlign: [
    { value: 'Left', label: '左对齐' },
    { value: 'Center', label: '居中' },
    { value: 'Right', label: '右对齐' },
    { value: 'Justified', label: '两端对齐' },
  ],
  
  // 垂直对齐选项
  verticalAlign: [
    { value: 'Top', label: '顶部对齐' },
    { value: 'Middle', label: '居中对齐' },
    { value: 'Bottom', label: '底部对齐' },
  ],
  
  // 边框样式选项
  borderStyles: [
    { value: 'Solid', label: '实线' },
    { value: 'Dashed', label: '虚线' },
    { value: 'Dotted', label: '点线' },
    { value: 'Double', label: '双线' },
  ],
  
  // 边框宽度选项
  borderWidths: [
    { value: 0, label: '无边框' },
    { value: 1, label: '细线' },
    { value: 2, label: '中等' },
    { value: 3, label: '粗线' },
    { value: 4, label: '特粗' },
  ],
  
  // 线条方向选项
  lineDirections: [
    { value: 'TopDown', label: '从上到下' },
    { value: 'BottomUp', label: '从下到上' },
    { value: 'LeftToRight', label: '从左到右' },
    { value: 'RightToLeft', label: '从右到左' },
  ],
};

// 元素默认样式
export const DEFAULT_ELEMENT_STYLE = {
  fontSize: 12,
  fontName: 'SansSerif',
  bold: false,
  italic: false,
  underline: false,
  forecolor: '#000000',
  backcolor: '#FFFFFF',
  hAlign: 'Left',
  vAlign: 'Top',
  borderStyle: 'Solid',
  borderColor: '#000000',
  borderWidth: 0,
  radius: 0,
};

// 元素属性配置
export const ELEMENT_PROPERTY_CONFIG = {
  staticText: {
    properties: [
      { key: 'text', label: '文本内容', type: 'text', required: true },
      { key: 'style.fontSize', label: '字体大小', type: 'number' },
      { key: 'style.fontName', label: '字体名称', type: 'select', options: 'fontNames' },
      { key: 'style.bold', label: '粗体', type: 'boolean' },
      { key: 'style.italic', label: '斜体', type: 'boolean' },
      { key: 'style.underline', label: '下划线', type: 'boolean' },
      { key: 'style.forecolor', label: '前景色', type: 'color' },
      { key: 'style.backcolor', label: '背景色', type: 'color' },
      { key: 'style.hAlign', label: '水平对齐', type: 'select', options: 'horizontalAlign' },
      { key: 'style.vAlign', label: '垂直对齐', type: 'select', options: 'verticalAlign' },
      { key: 'style.borderStyle', label: '边框样式', type: 'select', options: 'borderStyles' },
      { key: 'style.borderColor', label: '边框颜色', type: 'color' },
      { key: 'style.borderWidth', label: '边框宽度', type: 'select', options: 'borderWidths' },
    ],
  },
  textField: {
    properties: [
      { key: 'textFieldExpression', label: '字段表达式', type: 'text', required: true },
      { key: 'pattern', label: '格式模式', type: 'text' },
      { key: 'isStretchWithOverflow', label: '自动拉伸', type: 'boolean' },
      { key: 'isBlankWhenNull', label: '空值显示为空白', type: 'boolean' },
      { key: 'evaluationTime', label: '计算时间', type: 'select', options: 'evaluationTimes' },
      { key: 'style.fontSize', label: '字体大小', type: 'number' },
      { key: 'style.fontName', label: '字体名称', type: 'select', options: 'fontNames' },
      { key: 'style.bold', label: '粗体', type: 'boolean' },
      { key: 'style.italic', label: '斜体', type: 'boolean' },
      { key: 'style.underline', label: '下划线', type: 'boolean' },
      { key: 'style.forecolor', label: '前景色', type: 'color' },
      { key: 'style.backcolor', label: '背景色', type: 'color' },
      { key: 'style.hAlign', label: '水平对齐', type: 'select', options: 'horizontalAlign' },
      { key: 'style.vAlign', label: '垂直对齐', type: 'select', options: 'verticalAlign' },
      { key: 'style.borderStyle', label: '边框样式', type: 'select', options: 'borderStyles' },
      { key: 'style.borderColor', label: '边框颜色', type: 'color' },
      { key: 'style.borderWidth', label: '边框宽度', type: 'select', options: 'borderWidths' },
    ],
  },
  image: {
    properties: [
      { key: 'imageExpression', label: '图片表达式', type: 'text', required: true },
      { key: 'scaleImage', label: '缩放图片', type: 'select', options: 'imageScale' },
      { key: 'hAlign', label: '水平对齐', type: 'select', options: 'horizontalAlign' },
      { key: 'vAlign', label: '垂直对齐', type: 'select', options: 'verticalAlign' },
      { key: 'style.borderStyle', label: '边框样式', type: 'select', options: 'borderStyles' },
      { key: 'style.borderColor', label: '边框颜色', type: 'color' },
      { key: 'style.borderWidth', label: '边框宽度', type: 'select', options: 'borderWidths' },
    ],
  },
  line: {
    properties: [
      { key: 'direction', label: '线条方向', type: 'select', options: 'lineDirections' },
      { key: 'style.forecolor', label: '线条颜色', type: 'color' },
      { key: 'style.borderWidth', label: '线条宽度', type: 'select', options: 'borderWidths' },
    ],
  },
  rectangle: {
    properties: [
      { key: 'radius', label: '圆角半径', type: 'number' },
      { key: 'style.forecolor', label: '边框颜色', type: 'color' },
      { key: 'style.backcolor', label: '填充颜色', type: 'color' },
      { key: 'style.borderStyle', label: '边框样式', type: 'select', options: 'borderStyles' },
      { key: 'style.borderWidth', label: '边框宽度', type: 'select', options: 'borderWidths' },
    ],
  },
};

// 评估时间选项
export const EVALUATION_TIME_OPTIONS = [
  { value: 'Now', label: '现在' },
  { value: 'Report', label: '报表' },
  { value: 'Page', label: '页面' },
  { value: 'Column', label: '列' },
  { value: 'Group', label: '分组' },
  { value: 'Band', label: 'Band' },
  { value: 'Auto', label: '自动' },
];

// 图片缩放选项
export const IMAGE_SCALE_OPTIONS = [
  { value: 'Clip', label: '裁剪' },
  { value: 'FillFrame', label: '填充框架' },
  { value: 'RetainShape', label: '保持形状' },
  { value: 'RealHeight', label: '实际高度' },
  { value: 'RealSize', label: '实际大小' },
];