# JRXML Specification Reference
## Extracted from JasperReports Source Code

> **Note**: This document is extracted from JasperReports 6.21.5 source code.
> Some attributes marked as [Source Code] are defined in Java implementation but NOT in official XSD.

---

## Table of Contents
1. [Report Structure Hierarchy](#1-report-structure-hierarchy)
2. [JasperReport Root Element](#2-jasperreport-root-element)
3. [Data Definitions](#3-data-definitions)
4. [Bands and Sections](#4-bands-and-sections)
5. [Design Elements](#5-design-elements)
6. [Table and Crosstab Components](#6-table-and-crosstab-components)
7. [Attributes Missing from XSD](#7-attributes-missing-from-xsd)

---

## 1. Report Structure Hierarchy

```
jasperReport (Root Element)
├── property* (report properties)
├── propertyExpression* (dynamic properties)
├── import* (import statements)
├── template* (template references)
├── reportFont* (font definitions)
├── style* (style definitions)
├── subDataset* (sub-datasets)
├── scriptlet* (scriptlet definitions)
├── parameter* (input parameters)
├── queryString? (SQL query)
├── field* (data source fields)
├── sortField* (sort definitions)
├── variable* (computed variables)
├── filterExpression? (filter logic)
├── group* (grouping definitions)
│   ├── groupHeader?
│   │   └── band
│   │       └── element*
│   └── groupFooter?
│       └── band
│           └── element*
├── background?
│   └── band
├── title?
│   └── band
├── pageHeader?
│   └── band
├── columnHeader?
│   └── band
├── detail?
│   └── band
├── columnFooter?
│   └── band
├── pageFooter?
│   └── band
├── lastPageFooter?
│   └── band
├── summary?
│   └── band
└── noData?
    └── band
```

---

## 2. JasperReport Root Element

**XSD Definition**: `jasperreport.xsd:9`

### Child Element Order (MUST follow this exact sequence)
1. `property*` (0 or more)
2. `propertyExpression*` (0 or more)
3. `import*` (0 or more)
4. `template*` (0 or more)
5. `reportFont*` (0 or more)
6. `style*` (0 or more)
7. `subDataset*` (0 or more)
8. `scriptlet*` (0 or more)
9. `parameter*` (0 or more)
10. `queryString?` (0 or 1)
11. `field*` (0 or more)
12. `sortField*` (0 or more)
13. `variable*` (0 or more)
14. `filterExpression?` (0 or 1)
15. `group*` (0 or more)
16. `background?` (0 or 1)
17. `title?` (0 or 1)
18. `pageHeader?` (0 or 1)
19. `columnHeader?` (0 or 1)
20. `detail?` (0 or 1)
21. `columnFooter?` (0 or 1)
22. `pageFooter?` (0 or 1)
23. `lastPageFooter?` (0 or 1)
24. `summary?` (0 or 1)
25. `noData?` (0 or 1)

### Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | Yes | - | Report name |
| language | string | No | java | Expression language (java, groovy, etc.) |
| columnCount | NMTOKEN | No | 1 | Number of columns |
| printOrder | enum | No | Vertical | Column filling order: Vertical, Horizontal |
| columnDirection | enum | No | LTR | Column filling direction: LTR, RTL |
| pageWidth | NMTOKEN | No | 595 | Page width in points (A4: 595) |
| pageHeight | NMTOKEN | No | 842 | Page height in points (A4: 842) |
| orientation | enum | No | Portrait | Page orientation: Portrait, Landscape |
| whenNoDataType | enum | No | NoPages | No data behavior: NoPages, BlankPage, AllSectionsNoDetail, NoDataSection |
| sectionType | enum | No | Band | Report structure: Band, Part |
| columnWidth | NMTOKEN | No | 555 | Column width in points |
| columnSpacing | NMTOKEN | No | 0 | Space between columns |
| leftMargin | NMTOKEN | No | 20 | Left margin in points |
| rightMargin | NMTOKEN | No | 20 | Right margin in points |
| topMargin | NMTOKEN | No | 30 | Top margin in points |
| bottomMargin | NMTOKEN | No | 30 | Bottom margin in points |
| isTitleNewPage | boolean | No | false | Print title on separate page |
| isSummaryNewPage | boolean | No | false | Print summary on separate page |
| isSummaryWithPageHeaderAndFooter | boolean | No | false | Include page header/footer in summary |
| isFloatColumnFooter | boolean | No | false | Float column footer below detail |
| isIgnorePagination | boolean | No | false | Ignore pagination |
| csvEncoding | string | No | - | CSV encoding |
| csvFieldDelimiter | string | No | - | CSV field delimiter |
| svgIcons | boolean | No | false | Use SVG icons |
| uuid | UUID | No | - | Report UUID |
| evaluationTime | enum | No | Now | Evaluation time: Now, Band, Column, Group, Page, Report, AutoBand |
| evaluationGroup | string | No | - | Group for evaluation time |

---

## 3. Data Definitions

### 3.1 Parameter

**XSD Location**: `jasperreport.xsd`

#### Child Elements (in order)
1. `parameterDescription?` (0 or 1)
2. `defaultValueExpression?` (0 or 1)

#### Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | Yes | - | Parameter name |
| class | string | Yes | java.lang.String | Parameter data type |
| isForPrompting | boolean | No | true | Show in parameter dialog |
| nested | boolean | No | false | Is nested parameter |
| postProcessorExpression | string | No | - | Post-processing expression |
| postProcessorType | string | No | - | Post-processor type |

### 3.2 Field

**XSD Location**: `jasperreport.xsd`

#### Child Elements (in order)
1. `fieldDescription?` (0 or 1)

#### Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | Yes | - | Field name |
| class | string | Yes | java.lang.String | Field data type |
| uuid | UUID | No | - | Field UUID |

### 3.3 Variable

**XSD Location**: `jasperreport.xsd`

#### Child Elements (in order)
1. `variableExpression?` (0 or 1)
2. `initialValueExpression?` (0 or 1)

#### Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | Yes | - | Variable name |
| class | string | Yes | java.lang.String | Variable data type |
| calculation | enum | No | Nothing | Calculation type: Nothing, Count, Sum, Average, Lowest, Highest, StandardDeviation, Variance, System, First, CumulativeCount, CumulativeSum, CumulativeAverage, RunningTotalNumberOfPages, RunningTotalPageWidth, RunningTotalPageHeight |
| incrementType | enum | No | None | Increment type: None, Report, Page, Column, Group |
| incrementGroup | string | No | - | Group for increment |
| resetType | enum | No | Report | Reset type: None, Report, Page, Column, Group |
| resetGroup | string | No | - | Group for reset |
| calculationGroup | string | No | - | Group for calculation |
| isInitialized | boolean | No | false | Variable initialized |
| uuid | UUID | No | - | Variable UUID |

### 3.4 SortField

**XSD Location**: `jasperreport.xsd`

#### Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | Yes | - | Sort field name |
| order | enum | No | Ascending | Sort order: Ascending, Descending |
| type | enum | No | Field | Sort type: Field, Variable, Expression |
| uuid | UUID | No | - | SortField UUID |

### 3.5 QueryString

**XSD Location**: `jasperreport.xsd`

#### Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| language | string | No | sql | Query language |

---

## 4. Bands and Sections

### 4.1 Band

**XSD Location**: `jasperreport.xsd`

#### Child Elements (in order)
1. `element*` (0 or more) - design elements in the band
2. `band*` (0 or more) - sub-bands (only in detail band)

#### Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| height | NMTOKEN | Yes | - | Band height in points |
| splitType | enum | No | Stretch | Split behavior: Immediate, Stretch, Prevent |
| isSplitAllowed | boolean | No | true | Allow splitting |
| uuid | UUID | No | - | Band UUID |

### 4.2 Section Types

Each section type contains a single band:

| Section | XSD Element | Description |
|---------|-------------|-------------|
| background | `background` | Background band for all pages |
| title | `title` | Report title (first page only) |
| pageHeader | `pageHeader` | Header on every page |
| columnHeader | `columnHeader` | Header for each column |
| detail | `detail` | Detail rows |
| columnFooter | `columnFooter` | Footer for each column |
| pageFooter | `pageFooter` | Footer on every page |
| lastPageFooter | `lastPageFooter` | Footer on last page only |
| summary | `summary` | Report summary |
| noData | `noData` | When no data available |

---

## 5. Design Elements

### 5.1 Common Element Attributes

All design elements (staticText, textField, image, etc.) share these attributes:

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| key | string | No | - | Element identifier |
| mode | enum | No | Transparent | Background mode: Opaque, Transparent |
| x | NMTOKEN | Yes | - | X position in points |
| y | NMTOKEN | Yes | - | Y position in points |
| width | NMTOKEN | Yes | - | Width in points |
| height | NMTOKEN | Yes | - | Height in points |
| uuid | UUID | No | - | Element UUID |
| isRemoveLineWhenBlank | boolean | No | false | Remove line when blank |
| printWhenExpression | expression | No | - | Print condition |
| printWhenGroupChanges | string | No | - | Print when group changes |
| positionType | enum | No | FixRelativeToBand | Position type: FixRelativeToBand, Float |

### 5.2 StaticText Element

**XSD Location**: `jasperreport.xsd`

#### Child Elements (in order)
1. `reportElement` (required)
2. `box?` (optional) - border definition
3. `textElement?` (optional) - text formatting
4. `text` (required) - static text content

#### reportElement Attributes
*(see Common Element Attributes above)*

#### textElement Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| textAlignment | enum | No | Left | Horizontal alignment: Left, Center, Right, Justified |
| verticalAlignment | enum | No | Top | Vertical alignment: Top, Middle, Bottom |
| rotation | enum | No | None | Text rotation: None, Left, Right, UpsideDown |
| isStyledWithMarkup | boolean | No | false | Use markup styling |

#### text Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| markup | enum | No | none | Markup type: none, html, rtf, xml, csv |

#### box Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| border | enum | No | None | Border type: None, Thin, 1Point, 2Points, Medium, Double, Dashed, Dotted, etc. |
| borderColor | string | No | #000000 | Border color (RRGGBB) |
| backgroundColor | string | No | #FFFFFF | Background color (RRGGBB) |
| padding | NMTOKEN | No | 0 | Padding in points |

### 5.3 TextField Element

**XSD Location**: `jasperreport.xsd`

#### Child Elements (in order)
1. `reportElement` (required)
2. `box?` (optional)
3. `textElement?` (optional)
4. `textFieldExpression` (required) - expression to evaluate

#### textFieldExpression Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| pattern | string | No | - | Number/date format pattern |
| evaluationTime | enum | No | Now | When to evaluate: Now, Band, Column, Group, Page, Report, AutoBand |
| evaluationGroup | string | No | - | Group for evaluation |
| isStretchWithOverflow | boolean | No | false | Stretch to fit content |
| horizontalAlignment | enum | No | Left | Horizontal alignment |
| verticalAlignment | enum | No | Top | Vertical alignment |

### 5.4 Image Element

**XSD Location**: `jasperreport.xsd`

#### Child Elements (in order)
1. `reportElement` (required)
2. `box?` (optional)
3. `imageExpression` (required) - image source expression

#### imageExpression Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| class | string | No | java.lang.String | Expression return type |
| evaluationTime | enum | No | Now | When to evaluate |
| evaluationGroup | string | No | - | Group for evaluation |
| isUsingCache | boolean | No | false | Cache images |
| scaleImage | enum | No | RetainImage | Image scaling: Clip, FillFrame, RetainImage, RealHeight, RealSize |
| isCenterHorizontal | boolean | No | false | Center horizontally |
| isCenterVertical | boolean | No | false | Center vertically |
| horizontalAlignment | enum | No | Left | Horizontal alignment |
| verticalAlignment | enum | No | Top | Vertical alignment |
| border | enum | No | None | Border type |

### 5.5 Line Element

**XSD Location**: `jasperreport.xsd`

#### Child Elements (in order)
1. `reportElement` (required)
2. `graphicElement?` (optional) - line styling

#### graphicElement Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| penetration | enum | No | None | Line depth: None, 1Point, 2Points, 4Points |
| stroke | enum | No | Solid | Line stroke: Solid, Dashed, Dotted, Double |
| fillColor | string | No | #000000 | Line color (RRGGBB) |

### 5.6 Rectangle Element

**XSD Location**: `jasperreport.xsd`

#### Child Elements (in order)
1. `reportElement` (required)
2. `box?` (optional) - border and background

### 5.7 Ellipse Element

**XSD Location**: `jasperreport.xsd`

#### Child Elements (in order)
1. `reportElement` (required)
2. `graphicElement?` (optional) - ellipse styling

### 5.8 Frame Element

**XSD Location**: `jasperreport.xsd`

#### Child Elements (in order)
1. `reportElement` (required)
2. `element*` (0 or more) - nested elements
3. `box?` (optional) - border definition

### 5.9 Subreport Element

**XSD Location**: `jasperreport.xsd`

#### Child Elements (in order)
1. `reportElement` (required)
2. `parametersMapExpression?` (optional) - parameters mapping
3. `reportParameter*` (0 or more) - parameters to pass
4. `connectionExpression?` (optional) - data source connection
5. `dataSourceExpression?` (optional) - data source
6. `subreportExpression` (required) - subreport location

#### subreportExpression Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| class | string | No | java.lang.String | Expression type |
| evaluationTime | enum | No | Now | When to evaluate |
| evaluationGroup | string | No | - | Group for evaluation |
| isUsingCache | boolean | No | false | Cache subreports |

### 5.10 Break Element

**XSD Location**: `jasperreport.xsd`

#### Child Elements (in order)
1. `reportElement` (required)

#### Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| type | enum | Yes | - | Break type: Page, Column |

---

## 6. Table and Crosstab Components

### 6.1 Table Component

**XSD Location**: `components.xsd`

#### Child Elements (in order)
1. `column*` (1 or more) - table columns
2. `detail` (required) - detail band
3. `group*` (0 or more) - row groups
4. `header`? (optional) - table header
5. `footer`? (optional) - table footer
6. `columnHeader`? (optional) - column headers
7. `columnFooter`? (optional) - column footers

#### Table Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| uuid | UUID | No | - | Table UUID |
| printWholeTable | boolean | No | true | Print entire table |

### 6.2 Column Element

**[Source Code]** - Defined in Java: `StandardBaseColumn.java`

#### Child Elements (in order)
1. `tableHeader`? (optional) - column table header
2. `tableFooter`? (optional) - column table footer
3. `columnHeader`? (optional) - column header
4. `columnFooter`? (optional) - column footer
5. `groupHeader*` (0 or more) - group headers
6. `groupFooter*` (0 or more) - group footers

#### Column Attributes

| Attribute | Type | Required | Default | Source | Description |
|-----------|------|----------|---------|--------|-------------|
| width | integer | No | - | **[Source Code]** | Column width in points |
| weight | integer | No | - | **[Source Code 6.21.5+]** | Column weight for proportional sizing |
| uuid | UUID | No | - | XSD | Column UUID |

> ⚠️ **Important**: `width` and `weight` are defined in Java implementation but NOT in official XSD\!

### 6.3 Column Group Element

**XSD Location**: `components.xsd`

#### Child Elements (in order)
1. `tableHeader`? (optional) - group table header
2. `tableFooter`? (optional) - group table footer
3. `columnHeader`? (optional) - group column header
4. `columnFooter`? (optional) - group column footer
5. `groupHeader*` (0 or more) - nested group headers
6. `groupFooter*` (0 or more) - nested group footers
7. `column*` (0 or more) - sub-columns

#### Column Group Attributes

| Attribute | Type | Required | Default | Source | Description |
|-----------|------|----------|---------|--------|-------------|
| name | string | Yes | - | XSD | Group name |
| width | integer | No | - | **[Source Code]** | Group header width |
| weight | integer | No | - | **[Source Code 6.21.5+]** | Group weight for proportional sizing |
| uuid | UUID | No | - | XSD | Group UUID |

> ⚠️ **Important**: `width` and `weight` are defined in Java implementation but NOT in official XSD\!

### 6.4 Row Group Element

**XSD Location**: `components.xsd`

#### Child Elements (in order)
1. `bucket` (required) - group bucket definition
2. `groupHeader`? (optional)
3. `groupFooter`? (optional)

#### Row Group Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | Yes | - | Group name |
| height | NMTOKEN | Yes | - | Group header height |
| totalPosition | enum | No | None | Total row position: Start, End, None |
| headerPosition | enum | No | Left | Header alignment: Left, Center, Right, Stretch |
| mergeHeaderCells | boolean | No | true | Merge header cells |
| uuid | UUID | No | - | Group UUID |

### 6.5 Crosstab Component

**XSD Location**: `jasperreport.xsd`

#### Child Elements (in order)
1. `reportElement` (required)
2. `parametersMapExpression?` (optional)
3. `crosstabParameter*` (0 or more) - parameters
4. `dataset` (required) - dataset definition
5. `rowGroup*` (0 or more) - row groups
6. `columnGroup*` (0 or more) - column groups
7. `measure*` (0 or more) - measures
8. `cell*` (0 or more) - cells
9. `whenExpression?` (optional) - print condition

---

## 7. Attributes Missing from XSD

The following attributes are defined in Java source code but **NOT in official XSD**:

### 7.1 Table/Column Attributes

| Element | Attribute | Type | Java Class | Description |
|---------|-----------|------|------------|-------------|
| column | `width` | Integer | `StandardBaseColumn` | Column width |
| column | `weight` | Integer | `StandardBaseColumn` | Column weight (6.21.5+) |
| columnGroup | `width` | Integer | `StandardBaseColumn` | Group width |
| columnGroup | `weight` | Integer | `StandardBaseColumn` | Group weight (6.21.5+) |

### 7.2 Element Attributes

| Element | Attribute | Type | Java Class | Description |
|---------|-----------|------|------------|-------------|
| reportElement | `uuid` | UUID | `JRElement` | Element UUID (required in implementation) |
| all bands | `uuid` | UUID | `JRBand` | Band UUID |
| all elements | `uuid` | UUID | Various | UUID for all elements |

### 7.3 Report Attributes

| Element | Attribute | Type | Java Class | Description |
|---------|-----------|------|------------|-------------|
| jasperReport | `uuid` | UUID | `JasperDesign` | Report UUID |

---

## Appendix A: Common Data Types

| Type | Java Class | Description |
|------|------------|-------------|
| Boolean | java.lang.Boolean | True/False |
| Byte | java.lang.Byte | 8-bit integer |
| Short | java.lang.Short | 16-bit integer |
| Integer | java.lang.Integer | 32-bit integer |
| Long | java.lang.Long | 64-bit integer |
| Float | java.lang.Float | 32-bit float |
| Double | java.lang.Double | 64-bit float |
| BigDecimal | java.math.BigDecimal | Arbitrary precision decimal |
| String | java.lang.String | Text |
| Date | java.util.Date | Date and time |
| Time | java.sql.Time | Time only |
| Timestamp | java.sql.Timestamp | Timestamp with nanoseconds |

---

## Appendix B: Format Patterns

### Number Patterns
- `#,##0` - Integer with thousands separator
- `#,##0.00` - 2 decimal places
- `#,##0.##` - Up to 2 decimal places
- `$#,##0.00` - Currency with 2 decimals

### Date Patterns
- `yyyy-MM-dd` - ISO date
- `MM/dd/yyyy` - US date format
- `dd/MM/yyyy` - European date format
- `yyyy-MM-dd HH:mm:ss` - Date with time

---

## Appendix C: Enumerations

### Calculation Types
- `Nothing` - No calculation
- `Count` - Count rows
- `Sum` - Sum values
- `Average` - Average values
- `Lowest` - Minimum value
- `Highest` - Maximum value
- `StandardDeviation` - Standard deviation
- `Variance` - Variance
- `System` - System variable
- `First` - First value
- `CumulativeCount` - Cumulative count
- `CumulativeSum` - Cumulative sum
- `CumulativeAverage` - Cumulative average
- `RunningTotalNumberOfPages` - Running total of pages
- `RunningTotalPageWidth` - Running total of page width
- `RunningTotalPageHeight` - Running total of page height

### Reset/Increment Types
- `None` - Never reset/increment
- `Report` - Reset/increment on report
- `Page` - Reset/increment on page
- `Column` - Reset/increment on column
- `Group` - Reset/increment on group

### Split Types
- `Immediate` - Split at current position
- `Stretch` - Split only when element stretches
- `Prevent` - Prevent splitting

### Position Types
- `FixRelativeToBand` - Fixed position relative to band
- `Float` - Float below preceding elements

### Scale Image Types
- `Clip` - Clip to boundaries
- `FillFrame` - Stretch to fill frame
- `RetainImage` - Retain original size
- `RealHeight` - Scale to real height
- `RealSize` - Scale to real size

---

*Document generated from JasperReports source code at:*
`/Users/yan.yang/open/jrxml_web_designer/jasperreport6Fork/jasperreports/`
