// 模拟从元素库拖入的表格元素的完整结构
// 这应该与 ElementRegistry.ts 中定义的 defaultProps 一致
const mockTableFromLibrary = {
  type: 'table',
  x: 0,
  y: 0,
  width: 555,
  height: 200,
  dataset: {
    uuid: 'test-dataset-uuid',
    name: 'tableDataset'
  },
  // 从元素库拖入的表格可能同时有 children 和 columns 属性
  // 注意：这里的 children 是从 columns 转换而来的
  children: [
    {
      uuid: 'column1-uuid',
      width: 160,
      name: 'Column1',
      tableHeader: {
        enable: false,
        element: {
          type: 'staticText',
          x: 0,
          y: 0,
          width: 160,
          height: 30,
          text: 'Header',
          forecolor: '#000000',
          backcolor: '#FFFFFF',
          fontFamily: 'SansSerif',
          fontSize: 19,
          isBold: true,
          textAlignment: 'Center',
          verticalAlignment: 'Middle'
        }
      },
      columnHeader: {
        enable: true,
        element: {
          type: 'staticText',
          x: 0,
          y: 0,
          width: 160,
          height: 30,
          text: 'Column Header',
          textAlignment: 'Center',
          verticalAlignment: 'Middle'
        }
      },
      detailCell: {
        enable: true,
        element: {
          type: 'textField',
          x: 0,
          y: 0,
          width: 160,
          height: 30,
          expression: '$F{FIELD_NAME}',
          textAlignment: 'Center',
          verticalAlignment: 'Middle'
        }
      }
    },
    {
      uuid: 'column2-uuid',
      width: 180,
      name: 'Column2',
      tableHeader: {
        enable: false,
        element: {
          type: 'staticText',
          x: 0,
          y: 0,
          width: 180,
          height: 30,
          text: '',
          forecolor: '#000000',
          backcolor: '#FFFFFF',
          fontFamily: 'SansSerif',
          fontSize: 19,
          isBold: true,
          textAlignment: 'Center',
          verticalAlignment: 'Middle'
        }
      },
      columnHeader: {
        enable: true,
        element: {
          type: 'staticText',
          x: 0,
          y: 0,
          width: 180,
          height: 30,
          text: 'Column Header',
          textAlignment: 'Center',
          verticalAlignment: 'Middle'
        }
      },
      detailCell: {
        enable: true,
        element: {
          type: 'textField',
          x: 0,
          y: 0,
          width: 180,
          height: 30,
          expression: '$F{FIELD_NAME}',
          textAlignment: 'Center',
          verticalAlignment: 'Middle'
        }
      }
    },
    {
      uuid: 'column3-uuid',
      width: 215,
      name: 'Column3',
      tableHeader: {
        enable: false,
        element: {
          type: 'staticText',
          x: 0,
          y: 0,
          width: 215,
          height: 30,
          text: '',
          forecolor: '#000000',
          backcolor: '#FFFFFF',
          fontFamily: 'SansSerif',
          fontSize: 19,
          isBold: true,
          textAlignment: 'Center',
          verticalAlignment: 'Middle'
        }
      },
      columnHeader: {
        enable: true,
        element: {
          type: 'staticText',
          x: 0,
          y: 0,
          width: 215,
          height: 30,
          text: 'Column Header',
          textAlignment: 'Center',
          verticalAlignment: 'Middle'
        }
      },
      detailCell: {
        enable: true,
        element: {
          type: 'textField',
          x: 0,
          y: 0,
          width: 215,
          height: 30,
          expression: '$F{FIELD_NAME}',
          textAlignment: 'Center',
          verticalAlignment: 'Middle'
        }
      }
    }
  ],
  // 同时保留原始的 columns 属性
  columns: [
    {
      uuid: 'column1-uuid',
      width: 160,
      name: 'Column1'
    },
    {
      uuid: 'column2-uuid',
      width: 180,
      name: 'Column2'
    },
    {
      uuid: 'column3-uuid',
      width: 215,
      name: 'Column3'
    }
  ]
};

// 导入生成函数
import { generateJRXMLContent } from '../src/utils/jrxmlGenerator';

// 模拟报表属性
const mockProperties = {
  name: 'TestReport',
  pageWidth: 595,
  pageHeight: 842,
  leftMargin: 20,
  rightMargin: 20,
  topMargin: 20,
  bottomMargin: 20,
  columnWidth: 555,
  columnCount: 1,
  printOrder: 'Vertical',
  whenNoDataType: 'AllSectionsNoDetail',
  isTitleNewPage: false,
  isSummaryNewPage: false
};

// 模拟bands
const mockBands = [
  {
    type: 'detail',
    height: 200,
    elements: [mockTableFromLibrary]
  }
];

// 模拟fields
const mockFields = [
  {
    name: 'FIELD_NAME',
    class: 'java.lang.String'
  }
];

// 生成JRXML
console.log('=== 测试: 模拟从元素库拖入的表格 ===');
console.log('表格元素结构:');
console.log('- 类型:', mockTableFromLibrary.type);
console.log('- 宽度:', mockTableFromLibrary.width);
console.log('- 高度:', mockTableFromLibrary.height);
console.log('- 数据集:', mockTableFromLibrary.dataset.name);
console.log('- children 数量:', mockTableFromLibrary.children.length);
console.log('- columns 数量:', mockTableFromLibrary.columns.length);

// 检查每个子列的结构
console.log('\n- 子列详情:');
mockTableFromLibrary.children.forEach((column: any, index: number) => {
  console.log(`  列 ${index + 1}:`);
  console.log(`    - 名称: ${column.name}`);
  console.log(`    - 宽度: ${column.width}`);
  console.log(`    - 有 tableHeader: ${!!column.tableHeader}`);
  console.log(`    - tableHeader.enable: ${column.tableHeader?.enable}`);
  console.log(`    - 有 columnHeader: ${!!column.columnHeader}`);
  console.log(`    - columnHeader.enable: ${column.columnHeader?.enable}`);
  console.log(`    - 有 detailCell: ${!!column.detailCell}`);
  console.log(`    - 有 children: ${!!column.children}`);
});

const jrxmlContent = generateJRXMLContent(mockProperties, mockBands, mockFields);
console.log('\n\n=== 生成的JRXML ===');
console.log(jrxmlContent);

// 检查是否包含 jr:columnHeader 标签
console.log('\n=== 检查结果 ===');
const columnHeaderCount = (jrxmlContent.match(/<jr:columnHeader/g) || []).length;
if (columnHeaderCount > 0) {
  console.log(`✅ 成功: 生成了 ${columnHeaderCount} 个 jr:columnHeader 标签`);
} else {
  console.log('❌ 失败: 没有生成 jr:columnHeader 标签');
}

// 检查每个列是否都生成了 columnHeader
console.log('\n=== 详细检查 ===');
mockTableFromLibrary.children.forEach((column: any, index: number) => {
  const columnName = column.name || `Column${index + 1}`;
  if (jrxmlContent.includes(`value="${columnName}"`)) {
    console.log(`  列 "${columnName}": 找到了列定义`);
    // 检查该列是否有 columnHeader
    const columnDefinition = jrxmlContent.split(`<jr:column`).find((part: string) => 
      part.includes(`value="${columnName}"`)
    );
    if (columnDefinition && columnDefinition.includes('<jr:columnHeader')) {
      console.log(`    ✅ 有 columnHeader`);
    } else {
      console.log(`    ❌ 没有 columnHeader`);
    }
  }
});

// 检查是否有任何错误信息
console.log('\n=== 错误检查 ===');
if (jrxmlContent.includes('error') || jrxmlContent.includes('Error')) {
  console.log('⚠️  警告: JRXML 中可能包含错误信息');
} else {
  console.log('✅ 没有发现错误信息');
}
