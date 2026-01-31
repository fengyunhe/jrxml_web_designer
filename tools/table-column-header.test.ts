// 测试表格元素拖入设计区后是否生成 jr:columnHeader 标签
import { describe, it, expect } from 'vitest';
import { generateJRXMLContent } from '../src/utils/jrxmlGenerator';

describe('Table Column Header Generation', () => {
  it('should generate jr:columnHeader when table is dragged to design area', () => {
    // 模拟一个拖入设计区的表格元素
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
      columns: [
        {
          uuid: 'test-column-1',
          width: 160,
          name: 'Column1',
          hasTableHeader: false,
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
        }
      ],
      children: [] // 没有组合列
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
    const jrxmlContent = generateJRXMLContent(mockProperties, mockBands, mockFields);

    // 打印生成的JRXML
    console.log('Generated JRXML:');
    console.log(jrxmlContent);

    // 检查是否包含 jr:columnHeader 标签
    expect(jrxmlContent).toContain('<jr:columnHeader');
    console.log('✅ SUCCESS: Table column header is generated correctly');
  });

  it('should generate jr:columnHeader for tables with children array (like dragged from library)', () => {
    // 模拟从元素库拖入的表格元素，包含完整的children结构
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
      children: [
        {
          uuid: 'column1-uuid',
          width: 160,
          name: 'Column1',
          hasTableHeader: false,
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
          hasTableHeader: false,
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
    console.log('\n=== 测试: 从元素库拖入的表格（包含children和columns属性）===');
    console.log('表格元素结构:');
    console.log('- children 数量:', mockTableFromLibrary.children.length);
    console.log('- columns 数量:', mockTableFromLibrary.columns.length);

    const jrxmlContent = generateJRXMLContent(mockProperties, mockBands, mockFields);
    console.log('\n生成的JRXML:');
    console.log(jrxmlContent);

    // 检查是否包含 jr:columnHeader 标签
    const columnHeaderCount = (jrxmlContent.match(/<jr:columnHeader/g) || []).length;
    console.log('\n=== 检查结果 ===');
    console.log(`生成了 ${columnHeaderCount} 个 jr:columnHeader 标签`);
    
    expect(jrxmlContent).toContain('<jr:columnHeader');
    console.log('✅ SUCCESS: Table column headers are generated correctly for library-dragged table');
  });
});
