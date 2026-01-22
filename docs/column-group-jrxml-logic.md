# 列分组JRXML拼接与解析逻辑

## 1. 概述

本文档整理了表格列分组（Column Group）在JRXML中的拼接逻辑和解析逻辑，确保生成的JRXML结构完全符合XSD规范。

## 2. XSD规范参考

### 2.1 表格结构

根据`components.xsd`，表格（table）元素的结构如下：

```xml
<element name="table" substitutionGroup="jr:component">
    <complexType>
        <complexContent>
            <extension base="jr:componentType">
                <sequence>
                    <element ref="jr:datasetRun" minOccurs="1" maxOccurs="1" />
                    <choice minOccurs="0" maxOccurs="unbounded">
                        <element ref="c:columnGroup"/>
                        <element ref="c:column"/>
                    </choice>
                    <!-- 其他行定义 -->
                </sequence>
                <!-- 其他属性 -->
            </extension>
        </complexContent>
    </complexType>
</element>
```

### 2.2 列分组结构

```xml
<element name="columnGroup">
    <complexType>
        <complexContent>
            <extension base="c:BaseColumn">
                <sequence>
                    <choice minOccurs="1" maxOccurs="unbounded">
                        <element ref="c:columnGroup"/>
                        <element ref="c:column"/>
                    </choice>
                </sequence>
            </extension>
        </complexContent>
    </complexType>
</element>
```

### 2.3 基础列结构

```xml
<complexType name="BaseColumn">
    <sequence>
        <element ref="jr:property" minOccurs="0" maxOccurs="unbounded"/>
        <element ref="jr:propertyExpression" minOccurs="0" maxOccurs="unbounded"/>
        <element ref="jr:printWhenExpression" minOccurs="0" maxOccurs="1"/>
        <element name="tableHeader" type="c:TableCell" minOccurs="0"/>
        <element name="tableFooter" type="c:TableCell" minOccurs="0"/>
        <element name="groupHeader" type="c:TableGroupCell" minOccurs="0" maxOccurs="unbounded"/>
        <element name="groupFooter" type="c:TableGroupCell" minOccurs="0" maxOccurs="unbounded"/>
        <element name="columnHeader" type="c:TableCell" minOccurs="0"/>
        <element name="columnFooter" type="c:TableCell" minOccurs="0"/>
    </sequence>
    <attribute name="uuid" type="string" use="optional"/>
    <attribute name="width" use="required" type="unsignedInt"/>
</complexType>
```

## 3. 类型定义扩展

### 3.1 列分组接口

```ts
// 列分组接口
export interface ColumnGroup {
  uuid: string;
  name: string;
  width: number;
  hasTableHeader?: boolean;
  tableHeader?: DesignElement;
  columnHeader?: DesignElement;
  columnFooter?: DesignElement;
  tableFooter?: DesignElement;
  // 子分组或列
  children: (ColumnGroup | TableColumn)[];
}

// 扩展表格元素接口
export interface TableElement extends DesignElementBase {
  type: 'table';
  dataset: TableDataset;
  // 支持分组和列的混合结构
  children: (ColumnGroup | TableColumn)[];
  styles?: {
    tableHeader?: string;
    columnHeader?: string;
    detail?: string;
  };
  whenNoDataType?: 'Blank' | 'NoDataCell' | 'AllSectionsNoDetail';
}
```

## 4. JRXML拼接逻辑

### 4.1 表格生成主函数

```ts
function generateTableXML(element: any): string {
  // 现有代码...
  
  // 生成列和列分组
  const children = element.children || element.columns || [];
  children.forEach((child: any, index: number) => {
    if (child.children) {
      // 列分组
      xml += generateColumnGroupXML(child);
    } else {
      // 普通列
      xml += generateColumnXML(child, index);
    }
  });
  
  // 现有代码...
}
```

### 4.2 列分组生成函数

```ts
function generateColumnGroupXML(group: any): string {
  // 确保group有uuid，如果没有则生成一个
  const groupUuid = group.uuid || crypto.randomUUID();
  // 更新group的uuid，确保被保存
  group.uuid = groupUuid;
  
  let xml = `          <jr:columnGroup width="${toInt(group.width)}" uuid="${groupUuid}">\n`;
  xml += `            <property name="com.jaspersoft.studio.components.table.model.column.name" value="${group.name || `Group`}"/>\n`;
  
  // 生成tableHeader
  if (group.hasTableHeader && group.tableHeader) {
    xml += `            <jr:tableHeader height="${toInt(group.tableHeader.height)}" rowSpan="1">\n`;
    xml += generateElementXML(group.tableHeader).replace(/^    /gm, '                ');
    xml += `            </jr:tableHeader>\n`;
  }
  
  // 生成tableFooter
  if (group.tableFooter && group.tableFooter.expression) {
    xml += `            <jr:tableFooter height="${toInt(group.tableFooter.height)}" rowSpan="1">\n`;
    xml += generateElementXML(group.tableFooter).replace(/^    /gm, '                ');
    xml += `            </jr:tableFooter>\n`;
  }
  
  // 生成columnHeader
  if (group.columnHeader) {
    xml += `            <jr:columnHeader height="${toInt(group.columnHeader.height)}" rowSpan="1">\n`;
    xml += generateElementXML(group.columnHeader).replace(/^    /gm, '                ');
    xml += `            </jr:columnHeader>\n`;
  }
  
  // 生成columnFooter
  if (group.columnFooter && group.columnFooter.expression) {
    xml += `            <jr:columnFooter height="${toInt(group.columnFooter.height)}" rowSpan="1">\n`;
    xml += generateElementXML(group.columnFooter).replace(/^    /gm, '                ');
    xml += `            </jr:columnFooter>\n`;
  }
  
  // 生成子分组或列
  const children = group.children || [];
  children.forEach((child: any, index: number) => {
    if (child.children) {
      // 递归生成子分组
      xml += generateColumnGroupXML(child);
    } else {
      // 生成普通列
      xml += generateColumnXML(child, index);
    }
  });
  
  xml += `          </jr:columnGroup>\n`;
  return xml;
}
```

### 4.3 普通列生成函数（提取自现有逻辑）

```ts
function generateColumnXML(column: any, index: number): string {
  // 确保column有uuid，如果没有则生成一个
  const columnUuid = column.uuid || crypto.randomUUID();
  // 更新column的uuid，确保被保存
  column.uuid = columnUuid;
  
  let xml = `          <jr:column width="${toInt(column.width)}" uuid="${columnUuid}">\n`;
  xml += `            <property name="com.jaspersoft.studio.components.table.model.column.name" value="${column.name || `Column${index + 1}`}"/>\n`;
  
  // 生成tableHeader
  if (column.hasTableHeader && column.tableHeader) {
    xml += `            <jr:tableHeader height="${toInt(column.tableHeader.height)}" rowSpan="1">\n`;
    xml += generateElementXML(column.tableHeader).replace(/^    /gm, '                ');
    xml += `            </jr:tableHeader>\n`;
  }
  
  // 生成tableFooter
  if (column.tableFooter && column.tableFooter.expression) {
    xml += `            <jr:tableFooter height="${toInt(column.tableFooter.height)}" rowSpan="1">\n`;
    xml += generateElementXML(column.tableFooter).replace(/^    /gm, '                ');
    xml += `            </jr:tableFooter>\n`;
  }
  
  // 生成columnHeader
  if (column.columnHeader) {
    xml += `            <jr:columnHeader height="${toInt(column.columnHeader.height)}" rowSpan="1">\n`;
    xml += generateElementXML(column.columnHeader).replace(/^    /gm, '                ');
    xml += `            </jr:columnHeader>\n`;
  } else {
    xml += `            <jr:columnHeader height="30" rowSpan="1">\n`;
    xml += `            </jr:columnHeader>\n`;
  }
  
  // 生成columnFooter
  if (column.columnFooter && column.columnFooter.expression) {
    xml += `            <jr:columnFooter height="${toInt(column.columnFooter.height)}" rowSpan="1">\n`;
    xml += generateElementXML(column.columnFooter).replace(/^    /gm, '                ');
    xml += `            </jr:columnFooter>\n`;
  }
  
  // 生成detailCell
  if (column.detailCell) {
    xml += `            <jr:detailCell height="${toInt(column.detailCell.height)}">\n`;
    xml += generateElementXML(column.detailCell).replace(/^    /gm, '                ');
    xml += `            </jr:detailCell>\n`;
  } else {
    xml += `            <jr:detailCell height="30">\n`;
    xml += `            </jr:detailCell>\n`;
  }
  
  xml += `          </jr:column>\n`;
  return xml;
}
```

## 5. JRXML解析逻辑

### 5.1 表格解析主函数扩展

```ts
function parseTableElement(element: Element): any {
  // 现有代码...
  
  // 解析列和列分组
  const children: any[] = [];
  const columnGroups = tableElement.querySelectorAll('jr\:columnGroup, c\:columnGroup');
  columnGroups.forEach(groupElem => {
    children.push(parseColumnGroupElement(groupElem));
  });
  
  const columns = tableElement.querySelectorAll('jr\:column, c\:column');
  columns.forEach(columnElem => {
    children.push(parseColumnElement(columnElem));
  });
  
  table.children = children;
  
  // 现有代码...
}
```

### 5.2 列分组解析函数

```ts
function parseColumnGroupElement(groupElem: Element): any {
  const group: any = {
    type: 'columnGroup',
    uuid: groupElem.getAttribute('uuid') || '',
    width: parseInt(groupElem.getAttribute('width') || '0'),
    name: groupElem.querySelector('property[name="com.jaspersoft.studio.components.table.model.column.name"]')?.getAttribute('value') || 'Group',
    children: []
  };
  
  // 解析tableHeader
  const tableHeaderElem = groupElem.querySelector('jr\:tableHeader, c\:tableHeader');
  if (tableHeaderElem) {
    group.hasTableHeader = true;
    group.tableHeader = parseCellContent(tableHeaderElem);
  }
  
  // 解析tableFooter
  const tableFooterElem = groupElem.querySelector('jr\:tableFooter, c\:tableFooter');
  if (tableFooterElem) {
    group.tableFooter = parseCellContent(tableFooterElem);
  }
  
  // 解析columnHeader
  const columnHeaderElem = groupElem.querySelector('jr\:columnHeader, c\:columnHeader');
  if (columnHeaderElem) {
    group.columnHeader = parseCellContent(columnHeaderElem);
  }
  
  // 解析columnFooter
  const columnFooterElem = groupElem.querySelector('jr\:columnFooter, c\:columnFooter');
  if (columnFooterElem) {
    group.columnFooter = parseCellContent(columnFooterElem);
  }
  
  // 解析子分组
  const childGroups = groupElem.querySelectorAll('jr\:columnGroup, c\:columnGroup');
  childGroups.forEach(childGroupElem => {
    group.children.push(parseColumnGroupElement(childGroupElem));
  });
  
  // 解析子列
  const childColumns = groupElem.querySelectorAll('jr\:column, c\:column');
  childColumns.forEach(childColumnElem => {
    group.children.push(parseColumnElement(childColumnElem));
  });
  
  return group;
}
```

### 5.3 单元格内容解析函数

```ts
function parseCellContent(cellElem: Element): any {
  // 解析单元格高度
  const height = parseInt(cellElem.getAttribute('height') || '30');
  
  // 解析单元格内的元素
  const elements: any[] = [];
  const elementTypes = ['staticText', 'textField', 'image', 'line', 'rectangle'];
  
  elementTypes.forEach(type => {
    cellElem.querySelectorAll(type).forEach(element => {
      const parsedElement = parseElement(element, type);
      if (parsedElement) {
        elements.push(parsedElement);
      }
    });
  });
  
  // 返回第一个元素或创建默认元素
  if (elements.length > 0) {
    return {
      ...elements[0],
      height
    };
  }
  
  // 默认静态文本元素
  return {
    type: 'staticText',
    x: 0,
    y: 0,
    width: 100,
    height,
    text: '',
    textAlignment: 'Left',
    verticalAlignment: 'Middle'
  };
}
```

## 6. JRXML结构示例

### 6.1 带列分组的表格JRXML

```xml
<componentElement>
  <reportElement x="0" y="0" width="555" height="100"/>
  <jr:table xmlns:jr="http://jasperreports.sourceforge.net/jasperreports/components" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports/components http://jasperreports.sourceforge.net/xsd/components.xsd">
    <datasetRun subDataset="tableDataset" uuid="...">
      <connectionExpression><![CDATA[$P{REPORT_CONNECTION}]]></connectionExpression>
    </datasetRun>
    <!-- 列分组 -->
    <jr:columnGroup width="300" uuid="...">
      <property name="com.jaspersoft.studio.components.table.model.column.name" value="Group1"/>
      <jr:columnHeader height="30" rowSpan="1">
        <staticText>
          <reportElement x="0" y="0" width="300" height="30"/>
          <textElement textAlignment="Center" verticalAlignment="Middle">
            <font isBold="true"/>
          </textElement>
          <text><![CDATA[Group 1 Header]]></text>
        </staticText>
      </jr:columnHeader>
      <!-- 子列1 -->
      <jr:column width="150" uuid="...">
        <property name="com.jaspersoft.studio.components.table.model.column.name" value="Column1"/>
        <jr:columnHeader height="30" rowSpan="1">
          <staticText>
            <reportElement x="0" y="0" width="150" height="30"/>
            <textElement textAlignment="Center" verticalAlignment="Middle">
              <font isBold="true"/>
            </textElement>
            <text><![CDATA[Column 1]]></text>
          </staticText>
        </jr:columnHeader>
        <jr:detailCell height="30">
          <textField>
            <reportElement x="0" y="0" width="150" height="30"/>
            <textElement textAlignment="Left" verticalAlignment="Middle"/>
            <textFieldExpression><![CDATA[$F{column1}]]></textFieldExpression>
          </textField>
        </jr:detailCell>
      </jr:column>
      <!-- 子列2 -->
      <jr:column width="150" uuid="...">
        <property name="com.jaspersoft.studio.components.table.model.column.name" value="Column2"/>
        <jr:columnHeader height="30" rowSpan="1">
          <staticText>
            <reportElement x="0" y="0" width="150" height="30"/>
            <textElement textAlignment="Center" verticalAlignment="Middle">
              <font isBold="true"/>
            </textElement>
            <text><![CDATA[Column 2]]></text>
          </staticText>
        </jr:columnHeader>
        <jr:detailCell height="30">
          <textField>
            <reportElement x="0" y="0" width="150" height="30"/>
            <textElement textAlignment="Left" verticalAlignment="Middle"/>
            <textFieldExpression><![CDATA[$F{column2}]]></textFieldExpression>
          </textField>
        </jr:detailCell>
      </jr:column>
    </jr:columnGroup>
    <!-- 普通列 -->
    <jr:column width="255" uuid="...">
      <property name="com.jaspersoft.studio.components.table.model.column.name" value="Column3"/>
      <jr:columnHeader height="30" rowSpan="1">
        <staticText>
          <reportElement x="0" y="0" width="255" height="30"/>
          <textElement textAlignment="Center" verticalAlignment="Middle">
            <font isBold="true"/>
          </textElement>
          <text><![CDATA[Column 3]]></text>
        </staticText>
      </jr:columnHeader>
      <jr:detailCell height="30">
        <textField>
          <reportElement x="0" y="0" width="255" height="30"/>
          <textElement textAlignment="Left" verticalAlignment="Middle"/>
          <textFieldExpression><![CDATA[$F{column3}]]></textFieldExpression>
        </textField>
      </jr:detailCell>
    </jr:column>
  </jr:table>
</componentElement>
```

## 7. 实现注意事项

1. **UUID生成**：确保每个列和列分组都有唯一的UUID，用于标识和关联。
2. **命名规范**：使用Jaspersoft Studio兼容的属性名，确保生成的JRXML可以在Studio中正确打开和编辑。
3. **递归结构**：列分组支持嵌套，需要递归处理子分组和子列。
4. **向后兼容**：确保现有表格功能不受影响，支持同时处理带分组和不带分组的表格。
5. **XSD合规**：严格按照components.xsd规范生成JRXML，确保元素顺序和属性正确。
6. **默认值处理**：为可选元素和属性提供合理的默认值，确保生成的JRXML有效。

## 8. 测试建议

1. **单元测试**：为生成和解析函数编写单元测试，验证各种情况下的正确性。
2. **集成测试**：测试完整的表格生成和解析流程，确保端到端功能正常。
3. **XSD验证**：使用XSD验证工具验证生成的JRXML是否符合规范。
4. **Jaspersoft Studio测试**：将生成的JRXML导入Jaspersoft Studio，验证是否可以正确打开和编辑。

## 9. 后续优化方向

1. **性能优化**：对于大型表格，考虑优化生成和解析性能。
2. **扩展性**：设计灵活的架构，支持未来可能的表格功能扩展。
3. **错误处理**：增强错误处理机制，提供更详细的错误信息。
4. **文档完善**：补充详细的API文档和使用示例。

通过以上实现，可以确保列分组功能完全符合JRXML规范，同时保持良好的扩展性和兼容性。