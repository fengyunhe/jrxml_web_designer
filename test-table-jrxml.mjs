// 测试生成表格JRXML并验证是否符合XSD规范
import { generateJRXMLContent } from './src/utils/jrxmlGenerator.ts';
import fs from 'fs';

// 创建一个测试表格元素
const testTableElement = {
  type: 'table',
  uuid: 'test-table-uuid',
  x: 0,
  y: 0,
  width: 500,
  height: 300,
  columns: [
    {
      uuid: 'col1',
      name: 'Column 1',
      width: 150,
      columnHeader: {
        element: {
          type: 'staticText',
          text: 'Column 1 Header',
          x: 0,
          y: 0,
          width: 150,
          height: 30
        }
      },
      detailCell: {
        element: {
          type: 'textField',
          expression: '$F{field1}',
          x: 0,
          y: 0,
          width: 150,
          height: 30
        }
      }
    },
    {
      uuid: 'col2',
      name: 'Column 2',
      width: 150,
      columnHeader: {
        element: {
          type: 'staticText',
          text: 'Column 2 Header',
          x: 0,
          y: 0,
          width: 150,
          height: 30
        }
      },
      detailCell: {
        element: {
          type: 'textField',
          expression: '$F{field2}',
          x: 0,
          y: 0,
          width: 150,
          height: 30
        }
      }
    }
  ],
  dataset: {
    name: 'tableDataset',
    connectionExpression: '$P{REPORT_CONNECTION}'
  },
  tableHeader: {
    height: 30
  },
  columnHeader: {
    height: 30
  },
  detail: {
    height: 30
  },
  columnFooter: {
    height: 30
  },
  tableFooter: {
    height: 30
  },
  noData: {
    height: 60,
    style: 'Table_TD',
    elements: [
      {
        type: 'staticText',
        text: 'No data available',
        x: 0,
        y: 0,
        width: 500,
        height: 60
      }
    ]
  }
};

// 生成JRXML内容
const testReportProperties = {
  name: 'Test Report',
  pageWidth: 595,
  pageHeight: 842,
  leftMargin: 20,
  rightMargin: 20,
  topMargin: 30,
  bottomMargin: 30
};

const testBands = [
  {
    type: 'detail',
    height: 300,
    elements: [testTableElement]
  }
];

const testFields = [
  { name: 'field1', class: 'java.lang.String' },
  { name: 'field2', class: 'java.lang.String' }
];

try {
  const jrxml = generateJRXMLContent(testReportProperties, testBands, testFields);
  console.log('Generated JRXML:');
  console.log(jrxml);
  
  // 保存到文件
  fs.writeFileSync('./test-table.jrxml', jrxml);
  console.log('\nJRXML saved to test-table.jrxml');
} catch (error) {
  console.error('Error generating JRXML:', error);
}