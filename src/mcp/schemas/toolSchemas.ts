/**
 * MCP Tool Schemas - 工具Schema定义
 *
 * 定义所有MCP工具的输入schema，供本地AI模型调用
 */

export interface MCPToolSchema {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

// ============================================
// 查询工具
// ============================================

export const GET_DESIGN_STATE_SCHEMA: MCPToolSchema = {
  name: 'get_design_state',
  description: '获取当前报表的设计状态，包括所有元素、band、字段、参数等信息',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
};

export const GET_ELEMENT_SCHEMA: MCPToolSchema = {
  name: 'get_element',
  description: '获取指定元素的详细信息',
  inputSchema: {
    type: 'object',
    properties: {
      uuid: {
        type: 'string',
        description: '元素的UUID标识符'
      }
    },
    required: ['uuid']
  }
};

export const FIND_ELEMENTS_SCHEMA: MCPToolSchema = {
  name: 'find_elements',
  description: '按条件查找元素（字段名、参数名、元素类型或文本内容）',
  inputSchema: {
    type: 'object',
    properties: {
      fieldName: {
        type: 'string',
        description: '按字段名查找'
      },
      parameterName: {
        type: 'string',
        description: '按参数名查找'
      },
      elementType: {
        type: 'string',
        description: '按元素类型查找',
        enum: ['staticText', 'textField', 'image', 'line', 'rectangle', 'ellipse', 'break', 'frame', 'table']
      },
      text: {
        type: 'string',
        description: '按显示文本查找（部分匹配）'
      }
    },
    required: []
  }
};

// ============================================
// 创建工具
// ============================================

export const CREATE_STATIC_TEXT_SCHEMA: MCPToolSchema = {
  name: 'create_static_text',
  description: '创建静态文本元素',
  inputSchema: {
    type: 'object',
    properties: {
      bandType: {
        type: 'string',
        description: '目标Band类型',
        enum: ['detail', 'pageHeader', 'pageFooter', 'title', 'summary', 'columnHeader', 'columnFooter', 'background', 'lastPageFooter', 'noData']
      },
      x: {
        type: 'number',
        description: 'X坐标位置'
      },
      y: {
        type: 'number',
        description: 'Y坐标位置'
      },
      width: {
        type: 'number',
        description: '元素宽度'
      },
      height: {
        type: 'number',
        description: '元素高度'
      },
      text: {
        type: 'string',
        description: '静态文本内容'
      },
      fontSize: {
        type: 'number',
        description: '字体大小（默认12）'
      },
      fontFamily: {
        type: 'string',
        description: '字体名称（默认Arial）'
      },
      isBold: {
        type: 'boolean',
        description: '是否加粗'
      },
      isItalic: {
        type: 'boolean',
        description: '是否斜体'
      },
      forecolor: {
        type: 'string',
        description: '前景色（如"#000000"）'
      },
      backcolor: {
        type: 'string',
        description: '背景色'
      },
      textAlignment: {
        type: 'string',
        description: '文本对齐方式',
        enum: ['Left', 'Center', 'Right', 'Justified']
      }
    },
    required: ['bandType', 'x', 'y', 'width', 'height', 'text']
  }
};

export const CREATE_TEXT_FIELD_SCHEMA: MCPToolSchema = {
  name: 'create_text_field',
  description: '创建动态文本框，用于显示字段值或表达式',
  inputSchema: {
    type: 'object',
    properties: {
      bandType: {
        type: 'string',
        description: '目标Band类型',
        enum: ['detail', 'pageHeader', 'pageFooter', 'title', 'summary', 'columnHeader', 'columnFooter', 'background', 'lastPageFooter', 'noData']
      },
      x: {
        type: 'number',
        description: 'X坐标位置'
      },
      y: {
        type: 'number',
        description: 'Y坐标位置'
      },
      width: {
        type: 'number',
        description: '元素宽度'
      },
      height: {
        type: 'number',
        description: '元素高度'
      },
      expression: {
        type: 'string',
        description: '表达式，如"$F{fieldName}"或"$V{variableName}"'
      },
      fontSize: {
        type: 'number',
        description: '字体大小（默认12）'
      },
      fontFamily: {
        type: 'string',
        description: '字体名称（默认Arial）'
      },
      isBold: {
        type: 'boolean',
        description: '是否加粗'
      },
      pattern: {
        type: 'string',
        description: '格式化模式（如"#,##0.00"）'
      }
    },
    required: ['bandType', 'x', 'y', 'width', 'height', 'expression']
  }
};

export const CREATE_RECTANGLE_SCHEMA: MCPToolSchema = {
  name: 'create_rectangle',
  description: '创建矩形元素',
  inputSchema: {
    type: 'object',
    properties: {
      bandType: {
        type: 'string',
        description: '目标Band类型',
        enum: ['detail', 'pageHeader', 'pageFooter', 'title', 'summary', 'columnHeader', 'columnFooter', 'background', 'lastPageFooter', 'noData']
      },
      x: {
        type: 'number',
        description: 'X坐标位置'
      },
      y: {
        type: 'number',
        description: 'Y坐标位置'
      },
      width: {
        type: 'number',
        description: '元素宽度'
      },
      height: {
        type: 'number',
        description: '元素高度'
      },
      forecolor: {
        type: 'string',
        description: '前景色（边框色）'
      },
      backcolor: {
        type: 'string',
        description: '背景色'
      },
      mode: {
        type: 'string',
        description: '显示模式',
        enum: ['Opaque', 'Transparent']
      },
      lineWidth: {
        type: 'number',
        description: '边框宽度'
      },
      lineStyle: {
        type: 'string',
        description: '边框样式',
        enum: ['Solid', 'Dashed', 'Dotted']
      }
    },
    required: ['bandType', 'x', 'y', 'width', 'height']
  }
};

export const CREATE_FRAME_SCHEMA: MCPToolSchema = {
  name: 'create_frame',
  description: '创建Frame容器元素，可包含其他元素',
  inputSchema: {
    type: 'object',
    properties: {
      bandType: {
        type: 'string',
        description: '目标Band类型',
        enum: ['detail', 'pageHeader', 'pageFooter', 'title', 'summary', 'columnHeader', 'columnFooter', 'background', 'lastPageFooter', 'noData']
      },
      x: {
        type: 'number',
        description: 'X坐标位置'
      },
      y: {
        type: 'number',
        description: 'Y坐标位置'
      },
      width: {
        type: 'number',
        description: 'Frame宽度'
      },
      height: {
        type: 'number',
        description: 'Frame高度'
      },
      borderColor: {
        type: 'string',
        description: '边框颜色'
      },
      backgroundColor: {
        type: 'string',
        description: '背景颜色'
      }
    },
    required: ['bandType', 'x', 'y', 'width', 'height']
  }
};

// ============================================
// 修改工具
// ============================================

export const UPDATE_ELEMENT_SCHEMA: MCPToolSchema = {
  name: 'update_element',
  description: '更新指定元素的一个或多个属性',
  inputSchema: {
    type: 'object',
    properties: {
      uuid: {
        type: 'string',
        description: '元素的UUID标识符'
      },
      properties: {
        type: 'object',
        description: '要更新的属性键值对',
        properties: {
          x: { type: 'number', description: '新的X坐标' },
          y: { type: 'number', description: '新的Y坐标' },
          width: { type: 'number', description: '新的宽度' },
          height: { type: 'number', description: '新的高度' },
          text: { type: 'string', description: '文本内容（静态文本）' },
          expression: { type: 'string', description: '表达式（动态文本）' },
          fontSize: { type: 'number', description: '字体大小' },
          fontFamily: { type: 'string', description: '字体名称' },
          isBold: { type: 'boolean', description: '是否加粗' },
          isItalic: { type: 'boolean', description: '是否斜体' },
          forecolor: { type: 'string', description: '前景色' },
          backcolor: { type: 'string', description: '背景色' },
          textAlignment: {
            type: 'string',
            description: '文本对齐方式',
            enum: ['Left', 'Center', 'Right', 'Justified']
          }
        }
      }
    },
    required: ['uuid', 'properties']
  }
};

export const MOVE_ELEMENT_SCHEMA: MCPToolSchema = {
  name: 'move_element',
  description: '移动元素到新位置',
  inputSchema: {
    type: 'object',
    properties: {
      uuid: {
        type: 'string',
        description: '元素的UUID标识符'
      },
      x: {
        type: 'number',
        description: '新的X坐标'
      },
      y: {
        type: 'number',
        description: '新的Y坐标'
      }
    },
    required: ['uuid', 'x', 'y']
  }
};

// ============================================
// 删除工具
// ============================================

export const DELETE_ELEMENT_SCHEMA: MCPToolSchema = {
  name: 'delete_element',
  description: '删除指定元素',
  inputSchema: {
    type: 'object',
    properties: {
      uuid: {
        type: 'string',
        description: '元素的UUID标识符'
      }
    },
    required: ['uuid']
  }
};

// ============================================
// Band操作工具
// ============================================

export const UPDATE_BAND_HEIGHT_SCHEMA: MCPToolSchema = {
  name: 'update_band_height',
  description: '调整指定Band的高度',
  inputSchema: {
    type: 'object',
    properties: {
      bandType: {
        type: 'string',
        description: 'Band类型',
        enum: ['detail', 'pageHeader', 'pageFooter', 'title', 'summary', 'columnHeader', 'columnFooter', 'background', 'lastPageFooter', 'noData']
      },
      height: {
        type: 'number',
        description: '新的Band高度'
      }
    },
    required: ['bandType', 'height']
  }
};

// ============================================
// 批量操作工具
// ============================================

export const DELETE_ELEMENTS_SCHEMA: MCPToolSchema = {
  name: 'delete_elements',
  description: '批量删除多个元素',
  inputSchema: {
    type: 'object',
    properties: {
      uuids: {
        type: 'array',
        items: { type: 'string' },
        description: '要删除的元素UUID列表'
      }
    },
    required: ['uuids']
  }
};

export const MOVE_ELEMENTS_SCHEMA: MCPToolSchema = {
  name: 'move_elements',
  description: '批量移动多个元素到相对位置',
  inputSchema: {
    type: 'object',
    properties: {
      uuids: {
        type: 'array',
        items: { type: 'string' },
        description: '要移动的元素UUID列表'
      },
      deltaX: {
        type: 'number',
        description: 'X轴偏移量（像素）'
      },
      deltaY: {
        type: 'number',
        description: 'Y轴偏移量（像素）'
      }
    },
    required: ['uuids', 'deltaX', 'deltaY']
  }
};

export const UPDATE_ELEMENTS_STYLE_SCHEMA: MCPToolSchema = {
  name: 'update_elements_style',
  description: '批量更新多个元素的样式',
  inputSchema: {
    type: 'object',
    properties: {
      uuids: {
        type: 'array',
        items: { type: 'string' },
        description: '要更新的元素UUID列表'
      },
      fontSize: { type: 'number', description: '字体大小' },
      fontFamily: { type: 'string', description: '字体名称' },
      isBold: { type: 'boolean', description: '是否加粗' },
      isItalic: { type: 'boolean', description: '是否斜体' },
      forecolor: { type: 'string', description: '前景色' },
      backcolor: { type: 'string', description: '背景色' }
    },
    required: ['uuids']
  }
};

// ============================================
// 调整大小和对齐工具
// ============================================

export const RESIZE_ELEMENT_SCHEMA: MCPToolSchema = {
  name: 'resize_element',
  description: '调整元素大小',
  inputSchema: {
    type: 'object',
    properties: {
      uuid: {
        type: 'string',
        description: '元素的UUID标识符'
      },
      width: {
        type: 'number',
        description: '新的宽度'
      },
      height: {
        type: 'number',
        description: '新的高度'
      }
    },
    required: ['uuid']
  }
};

export const RESIZE_ELEMENTS_SCHEMA: MCPToolSchema = {
  name: 'resize_elements',
  description: '批量调整多个元素大小',
  inputSchema: {
    type: 'object',
    properties: {
      uuids: {
        type: 'array',
        items: { type: 'string' },
        description: '要调整大小的元素UUID列表'
      },
      width: {
        type: 'number',
        description: '新的宽度（如果提供）'
      },
      height: {
        type: 'number',
        description: '新的高度（如果提供）'
      }
    },
    required: ['uuids']
  }
};

export const ALIGN_ELEMENTS_SCHEMA: MCPToolSchema = {
  name: 'align_elements',
  description: '对齐多个元素',
  inputSchema: {
    type: 'object',
    properties: {
      uuids: {
        type: 'array',
        items: { type: 'string' },
        description: '要对齐的元素UUID列表'
      },
      alignment: {
        type: 'string',
        description: '对齐方式',
        enum: ['left', 'center', 'right', 'top', 'middle', 'bottom']
      }
    },
    required: ['uuids', 'alignment']
  }
};

export const DISTRIBUTE_ELEMENTS_SCHEMA: MCPToolSchema = {
  name: 'distribute_elements',
  description: '均匀分布多个元素',
  inputSchema: {
    type: 'object',
    properties: {
      uuids: {
        type: 'array',
        items: { type: 'string' },
        description: '要分布的元素UUID列表'
      },
      direction: {
        type: 'string',
        description: '分布方向',
        enum: ['horizontal', 'vertical']
      }
    },
    required: ['uuids', 'direction']
  }
};

// ============================================
// 撤销/重做工具
// ============================================

export const UNDO_SCHEMA: MCPToolSchema = {
  name: 'undo',
  description: '撤销上一个操作',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
};

export const REDO_SCHEMA: MCPToolSchema = {
  name: 'redo',
  description: '重做上一个操作',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
};

// ============================================
// 报表属性工具
// ============================================

export const UPDATE_REPORT_PROPERTIES_SCHEMA: MCPToolSchema = {
  name: 'update_report_properties',
  description: '更新报表属性（页面大小、边距、标题等）',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: '报表名称' },
      pageWidth: { type: 'number', description: '页面宽度' },
      pageHeight: { type: 'number', description: '页面高度' },
      leftMargin: { type: 'number', description: '左边距' },
      rightMargin: { type: 'number', description: '右边距' },
      topMargin: { type: 'number', description: '上边距' },
      bottomMargin: { type: 'number', description: '下边距' },
      title: { type: 'string', description: '报表标题' }
    },
    required: []
  }
};

export const ADD_FIELD_SCHEMA: MCPToolSchema = {
  name: 'add_field',
  description: '添加新的数据字段',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: '字段名称'
      },
      classType: {
        type: 'string',
        description: '字段类型',
        enum: ['java.lang.String', 'java.lang.Integer', 'java.lang.Long', 'java.lang.Float', 'java.lang.Double', 'java.math.BigDecimal', 'java.util.Date', 'java.sql.Date', 'java.sql.Timestamp']
      },
      description: {
        type: 'string',
        description: '字段描述'
      }
    },
    required: ['name']
  }
};

export const ADD_PARAMETER_SCHEMA: MCPToolSchema = {
  name: 'add_parameter',
  description: '添加新的报表参数',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: '参数名称'
      },
      classType: {
        type: 'string',
        description: '参数类型',
        enum: ['java.lang.String', 'java.lang.Integer', 'java.lang.Long', 'java.lang.Float', 'java.lang.Double', 'java.math.BigDecimal', 'java.util.Date', 'java.sql.Date', 'java.sql.Timestamp']
      },
      description: {
        type: 'string',
        description: '参数描述'
      },
      defaultValue: {
        type: 'string',
        description: '默认值表达式'
      }
    },
    required: ['name']
  }
};

// ============================================
// 导出所有工具Schema
// ============================================

export const ALL_MCP_TOOL_SCHEMAS: MCPToolSchema[] = [
  // 查询工具
  GET_DESIGN_STATE_SCHEMA,
  GET_ELEMENT_SCHEMA,
  FIND_ELEMENTS_SCHEMA,
  // 创建工具
  CREATE_STATIC_TEXT_SCHEMA,
  CREATE_TEXT_FIELD_SCHEMA,
  CREATE_RECTANGLE_SCHEMA,
  CREATE_FRAME_SCHEMA,
  // 修改工具
  UPDATE_ELEMENT_SCHEMA,
  MOVE_ELEMENT_SCHEMA,
  // 删除工具
  DELETE_ELEMENT_SCHEMA,
  // Band操作工具
  UPDATE_BAND_HEIGHT_SCHEMA,
  // 批量操作工具
  DELETE_ELEMENTS_SCHEMA,
  MOVE_ELEMENTS_SCHEMA,
  UPDATE_ELEMENTS_STYLE_SCHEMA,
  // 调整大小和对齐工具
  RESIZE_ELEMENT_SCHEMA,
  RESIZE_ELEMENTS_SCHEMA,
  ALIGN_ELEMENTS_SCHEMA,
  DISTRIBUTE_ELEMENTS_SCHEMA,
  // 撤销/重做工具
  UNDO_SCHEMA,
  REDO_SCHEMA,
  // 报表属性工具
  UPDATE_REPORT_PROPERTIES_SCHEMA,
  ADD_FIELD_SCHEMA,
  ADD_PARAMETER_SCHEMA
];

// 获取工具Schema映射
export const MCP_TOOL_SCHEMA_MAP: Record<string, MCPToolSchema> = {};
ALL_MCP_TOOL_SCHEMAS.forEach(schema => {
  MCP_TOOL_SCHEMA_MAP[schema.name] = schema;
});

// 生成AI模型可理解的工具定义格式
export function generateAIToolDefinitions(): Array<{
  name: string;
  description: string;
  parameters: any;
}> {
  return ALL_MCP_TOOL_SCHEMAS.map(schema => ({
    name: schema.name,
    description: schema.description,
    parameters: schema.inputSchema
  }));
}
