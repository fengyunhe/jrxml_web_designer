import { generateJRXMLContent } from '../src/utils/jrxmlGenerator';

// 模拟一个从元素库拖入的表格元素
const mockTableElement = {
  type: 'table',
  x: 0,
  y: 0,
  width: 555,
  height: 200,
  dataset: {
    uuid: 'test-dataset-uuid',
    name: 'tableDataset'
  },
  // 注意：这里只设置了 columns 属性，没有 children 属性
  columns: [
    {
      uuid: 'test-column-1',
      width: 160,
      name: 'Column1',
      tableHeader: {
        enable: false,
        element: {
          type: 'staticText',
          text: 'Header',
          x: 0,
          y: 0,
          width: 160,
          height: 30
        }
      },
      columnHeader: {
        enable: true,
        element: {
          type: 'staticText',
          text: 'Column Header',
          x: 0,
          y: 0,
          width: 160,
          height: 30
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
    }
  ]
};

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
    elements: [mockTableElement]
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
console.log('=== 测试 1: 只有 columns 属性的表格 ===');
console.log('表格元素结构:', JSON.stringify(mockTableElement, null, 2));

const jrxmlContent1 = generateJRXMLContent(mockProperties, mockBands, mockFields);
console.log('\n生成的JRXML:');
console.log(jrxmlContent1);

// 检查是否包含 jr:columnHeader 标签
console.log('\n=== 检查结果 ===');
if (jrxmlContent1.includes('<jr:columnHeader')) {
  console.log('✅ 成功: 生成了 jr:columnHeader 标签');
} else {
  console.log('❌ 失败: 没有生成 jr:columnHeader 标签');
}

// 测试 2: 添加一个空的 children 属性
const mockTableElementWithEmptyChildren = {
  ...mockTableElement,
  children: [] // 空的 children 数组
};

console.log('\n\n=== 测试 2: 有 columns 属性和空 children 属性的表格 ===');
console.log('表格元素结构:', JSON.stringify(mockTableElementWithEmptyChildren, null, 2));

const jrxmlContent2 = generateJRXMLContent(mockProperties, [
  {
    type: 'detail',
    height: 200,
    elements: [mockTableElementWithEmptyChildren]
  }
], mockFields);

console.log('\n生成的JRXML:');
console.log(jrxmlContent2);

// 检查是否包含 jr:columnHeader 标签
console.log('\n=== 检查结果 ===');
if (jrxmlContent2.includes('<jr:columnHeader')) {
  console.log('✅ 成功: 生成了 jr:columnHeader 标签');
} else {
  console.log('❌ 失败: 没有生成 jr:columnHeader 标签');
}

// 测试 3: 有 children 属性但不包含列分组的表格
const mockTableElementWithChildren = {
  ...mockTableElement,
  children: [
    {
      uuid: 'test-column-1',
      width: 160,
      name: 'Column1',
      tableHeader: {
        enable: false,
        element: {
          type: 'staticText',
          text: 'Header',
          x: 0,
          y: 0,
          width: 160,
          height: 30
        }
      },
      columnHeader: {
        enable: true,
        element: {
          type: 'staticText',
          text: 'Column Header',
          x: 0,
          y: 0,
          width: 160,
          height: 30
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
    }
  ]
};

console.log('\n\n=== 测试 3: 有 children 属性但不包含列分组的表格 ===');
console.log('表格元素结构:', JSON.stringify(mockTableElementWithChildren, null, 2));

const jrxmlContent3 = generateJRXMLContent(mockProperties, [
  {
    type: 'detail',
    height: 200,
    elements: [mockTableElementWithChildren]
  }
], mockFields);

console.log('\n生成的JRXML:');
console.log(jrxmlContent3);

// 检查是否包含 jr:columnHeader 标签
console.log('\n=== 检查结果 ===');
if (jrxmlContent3.includes('<jr:columnHeader')) {
  console.log('✅ 成功: 生成了 jr:columnHeader 标签');
} else {
  console.log('❌ 失败: 没有生成 jr:columnHeader 标签');
}
