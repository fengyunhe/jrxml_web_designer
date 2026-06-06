# JRXML Web Designer - Architecture Specification

## 1. Overview

JRXML Web Designer is a browser-based visual editor for JasperReports JRXML templates. Users interact with a drag-and-drop canvas to design report layouts, and the application maintains a bidirectional data flow between the visual UI, a structured JSON model, and the JRXML XML format.

### 1.1 Design Goals

- **WYSIWYG**: What you see in the designer matches the generated JRXML structure
- **Round-trip fidelity**: JRXML → import → JSON → edit → export → JRXML should be lossless for supported features
- **JasperReports compliance**: Generated JRXML must be valid according to the JasperReports Library XSD schema
- **No server dependency**: The designer runs entirely in the browser; JRXML generation and parsing are client-side

## 2. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interaction                      │
│              (click, drag, type, select)                 │
└──────────────────────┬──────────────────────────────────┘
                       │ events
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  Vue Reactive State                      │
│  (reportProperties, bands, fields, parameters, etc.)    │
│                                                          │
│  This IS the structured JSON model.                     │
│  All UI components bind to this via :props / v-model.   │
└──────┬──────────────────────────────────┬───────────────┘
       │                                  │
       ▼                                  ▼
┌──────────────────┐            ┌──────────────────────────┐
│  Visual Canvas   │            │  Export / Import          │
│  (designer UI)   │            │                           │
│                  │            │  export: JSON → JRXML     │
│  Renders bands,  │            │  import: JRXML → JSON     │
│  elements,       │            │                           │
│  selection,      │            │  Modules:                 │
│  drag/resize     │            │  jrxmlGenerator.ts        │
└──────────────────┘            │  jrxml/parse.ts           │
                                └──────────────────────────┘
```

### 2.1 The Three Critical Transformations

#### Transformation A: Visual UI → JSON Model (Binding)

When the user interacts with the canvas, Vue event handlers mutate the reactive JSON state directly:

- **Element creation**: Drag from element palette → push new `DesignElement` into `band.elements[]`
- **Element modification**: Property panel edits → update element properties in-place
- **Element movement**: Drag on canvas → update `element.x`, `element.y`
- **Element deletion**: Delete key / context menu → splice from `band.elements[]`
- **Band resize**: Drag band edge → update `band.height`

The JSON model is the single source of truth. The canvas reads from it; property panels read and write to it.

#### Transformation B: JSON → JRXML (Generation)

**Entry point**: `generateJRXMLContent(properties, bands, fields, parameters, subDatasets, styles, variables, reportProperties)` in `src/utils/jrxmlGenerator.ts`

Process:
1. Build XML declaration and `<jasperReport>` open tag with page/margin attributes
2. Append `<field>` declarations for each field in the field list
3. Append `<parameter>` declarations for each parameter
4. For each band (title, pageHeader, columnHeader, detail, columnFooter, pageFooter, summary):
   - Emit `<band height="N">` tag
   - For each element in `band.elements[]`:
     - Emit `<reportElement x="..." y="..." width="..." height="..." uuid="..."/>` with style attributes
     - Emit element-type-specific content (e.g., `<text><![CDATA[...]]></text>` for staticText)
     - Emit `<box>` if border properties are set
     - Emit `<font>` if font properties differ from defaults
5. Close all tags

**Key detail**: The `columnWidth` is computed as `pageWidth - leftMargin - rightMargin`.

#### Transformation C: JRXML → JSON (Parsing)

**Entry point**: `parseJRXMLContent(jrxmlContent)` in `src/utils/jrxml/parse.ts`

Process:
1. Parse XML string via `DOMParser`
2. Extract `jasperReport` root element attributes → `ReportProperties`
3. Extract `<queryString>` → `query`
4. Extract `<field>` elements → `Field[]`
5. Extract `<parameter>` elements → `Parameter[]`
6. Extract `<subDataset>` elements → `SubDataset[]`
7. For each band section (`<title>`, `<detail>`, etc.):
   - Extract `<band height="N">` → `Band.height`
   - For each child element (`<staticText>`, `<textField>`, `<image>`, `<line>`, `<rectangle>`, `<ellipse>`, `<frame>`, `<componentElement>`):
     - Parse `<reportElement>` attributes → position, size, uuid, style properties
     - Parse element-specific content (text, expression, imageExpression, etc.)
     - Parse `<box>` / `<pen>` → border/pen properties
     - Parse `<font>` → font properties
     - For `<frame>`: recursively parse child elements
     - For `<componentElement>` containing `<jr:table>`: parse table structure

**Namespace handling**: The parser uses three strategies to find elements:
1. Direct child lookup by tagName
2. Namespace-aware lookup via `getElementsByTagNameNS`
3. Fallback to `localName` matching

## 3. Data Model

### 3.1 Report Properties

```typescript
interface ReportProperties {
  name: string;           // Report name (maps to jasperReport @name)
  pageWidth: number;      // Page width in points (A4 = 595)
  pageHeight: number;     // Page height in points (A4 = 842)
  leftMargin: number;     // Left margin in points
  rightMargin: number;    // Right margin in points
  topMargin: number;      // Top margin in points
  bottomMargin: number;   // Bottom margin in points
  defaultFont: FontSettings;
  orientation?: 'portrait' | 'landscape';
}
```

**Derived**: `columnWidth = pageWidth - leftMargin - rightMargin`

### 3.2 Band Structure

Bands are layout regions arranged vertically on the page:

```
┌────────────────────────────┐
│         title              │  ← Optional, rendered once
├────────────────────────────┤
│       pageHeader           │  ← Repeats on each page
├────────────────────────────┤
│      columnHeader          │  ← Repeats on each page
├────────────────────────────┤
│                            │
│         detail             │  ← Repeats per data row
│                            │
├────────────────────────────┤
│      columnFooter          │
├────────────────────────────┤
│       pageFooter           │  ← Repeats on each page
├────────────────────────────┤
│         summary            │  ← Rendered once at end
└────────────────────────────┘
```

Each `Band` contains an array of `DesignElement[]`.

### 3.3 Element Types

| Type | JRXML Tag | Key Properties |
|------|-----------|---------------|
| `staticText` | `<staticText>` | text, font, alignment, markup |
| `textField` | `<textField>` | expression (`$F{field}`, `$P{param}`), pattern, evaluationTime |
| `image` | `<image>` | imageExpression, scaleType, onError |
| `line` | `<line>` | lineDirection, lineWidth |
| `rectangle` | `<rectangle>` | radius (rounded corners), pen |
| `ellipse` | `<ellipse>` | pen |
| `break` | `<break>` | breakType (Page/Column) |
| `frame` | `<frame>` | elements[] (nested children), layout |
| `table` | `<componentElement>` + `<jr:table>` | dataset, columns, columnGroups, rowGroups |

All elements share:
- Position: `x`, `y` (in points, from top-left of parent band/frame)
- Size: `width`, `height`
- UUID: required by JasperReports XSD
- Style properties: forecolor, backcolor, mode, font, alignment, box/borders

### 3.4 Table Component

Tables are the most complex element type. They use a `<componentElement>` wrapper with `<jr:table>` inside:

```xml
<componentElement>
  <reportElement .../>
  <jr:table whenNoDataType="AllSectionsNoDetail">
    <datasetRun subDataset="...">
      <connectionExpression><![CDATA[$P{REPORT_CONNECTION}]]></connectionExpression>
    </datasetRun>
    <jr:column width="185">
      <jr:tableHeader height="30" rowSpan="2" style="Table_TH">...</jr:tableHeader>
      <jr:columnHeader height="20" rowSpan="1" style="Table_CH">...</jr:columnHeader>
      <jr:detailCell height="15" style="Table_TD">...</jr:detailCell>
      <jr:columnFooter height="15" style="Table_CH">...</jr:columnFooter>
      <jr:tableFooter height="15" style="Table_TH">...</jr:tableFooter>
    </jr:column>
    <jr:columnGroup width="370">
      <jr:tableHeader height="15" style="Table_TH">...</jr:tableHeader>
      <jr:columnGroup width="185">
        <jr:columnHeader height="15" style="Table_CH">...</jr:columnHeader>
        <jr:column>...</jr:column>
      </jr:columnGroup>
      <jr:columnGroup width="185">
        <jr:columnHeader height="15" style="Table_CH">...</jr:columnHeader>
        <jr:column>...</jr:column>
      </jr:columnGroup>
    </jr:columnGroup>
  </jr:table>
</componentElement>
```

#### 3.4.1 Table Structure

Tables have:
- `TableDataset` with its own fields and query
- `ColumnGroup` for nested column headers (supports recursive grouping)
- `TableColumn` for individual columns
- Cell types: `tableHeader`, `columnHeader`, `detailCell`, `columnFooter`, `tableFooter`

#### 3.4.2 Column Merging (rowSpan)

- **rowSpan attribute**: Indicates how many rows a cell spans vertically
- **Merged cells**: For cells with `rowSpan > 1`, the cell height must be `singleRowHeight × rowSpan`
- **Example**: If column header has `rowSpan="2"` and single row height is 15, then actual height = 30
- **Height calculation**: The system tracks both merged height (for rendering) and single row height (for configuration)

#### 3.4.3 Row Height Management

Each table has five types of configurable row heights:
1. **tableHeader** - Table-level header (optional)
2. **columnHeader** - Column headers (can be merged via rowSpan)
3. **detailCell** - Data rows (repeated for each record)
4. **columnFooter** - Column-level footer (optional)
5. **tableFooter** - Table-level footer (optional)

**Height synchronization logic**:
- When user changes row height, all cells of that type across all columns are updated
- For merged cells (rowSpan > 1), actual height = configured height × rowSpan
- The system avoids duplicate updates using processed column tracking
- Changes emit to parent component to update bands and trigger JRXML regeneration

#### 3.4.4 Complex Column Group Scenarios

Column groups can be nested to multiple levels:

```
ColumnGroup (level 0)
  ├── ColumnGroup (level 1)
  │     ├── Column (with detailCell)
  │     └── Column (with detailCell)
  └── ColumnGroup (level 1)
        ├── Column (with detailCell)
        └── Column (with detailCell)
```

**Recursive processing**:
- `updateAllColumnRowHeights()` processes all columns and nested groups
- `updateGroupRowHeights()` recursively handles nested column groups
- Each group can have its own `tableHeader`, `columnHeader`, etc.
- All cells are collected for height calculation via `allColumnsForHeight` computed property

#### 3.4.5 Designer Canvas Rendering

- **Table layout**: Uses `table-layout: fixed` to prevent content from expanding columns
- **Cell height**: Rendered from JSON data via inline `height` styles (not CSS defaults)
- **Vertical alignment**: Cells use `vertical-align: top` to prevent content stretching
- **Overflow handling**: Cells have `overflow: hidden` to prevent row height expansion
- **Maximum height tracking**: `getMaxCellHeight()` computes maximum height across all cells of same type

## 4. File Inventory

### 4.0 Reference Source (DO NOT MODIFY)

| Directory | Purpose |
|-----------|---------|
| `jasperreport6Fork/` | Official JasperReports Library (JasperStudio) source code. **Reference only — never modify files in this directory.** Used for understanding JasperReports internals, XSD schema, and JRXML parsing/generation behavior. |

### 4.1 Core Logic

| File | Purpose |
|------|---------|
| `src/utils/jrxmlGenerator.ts` | JSON → JRXML generation |
| `src/utils/jrxml/parse.ts` | JRXML → JSON parsing |
| `src/utils/jrxml/types.ts` | Type definitions for parse/generate |
| `src/utils/jrxml/xmlBuilder.ts` | XML tag builder utilities |
| `src/utils/jrxml/validator.ts` | JRXML structural validation rules |

### 4.2 Type System

| File | Purpose |
|------|---------|
| `src/types/index.ts` | All TypeScript interfaces (DesignElement, Band, etc.) |

### 4.3 UI Components

| File | Purpose |
|------|---------|
| `src/components/PDFDesigner.vue` | Main designer orchestrator |
| `src/components/designer/` | Canvas rendering sub-components |
| `src/components/modals/PdfPreviewModal.vue` | PDF preview via external server |
| `src/components/modals/PreviewServerSettingsModal.vue` | Configure preview server URL |
| `src/components/BottomPanel.vue` | Bottom toolbar |

### 4.4 Configuration

| File | Purpose |
|------|---------|
| `src/config/apiConfig.ts` | API endpoint constants |
| `vite.config.ts` | Build configuration |
| `vitest.config.ts` | Test configuration |

### 4.5 Tests

| File | Purpose |
|------|---------|
| `src/utils/jrxmlGenerator.test.ts` | Generator unit tests |
| `src/utils/jrxml/parse.test.ts` | Parser unit tests |
| `tests/unit/*.test.ts` | Additional unit tests |
| `tests/*.jrxml` | JRXML fixture files |
| `tests/jrxml-pdf-preview.integration.test.ts` | Server integration tests |

## 5. Round-Trip Testing Strategy

Round-trip integrity is verified by:

1. **Fixture-based tests**: Load `.jrxml` fixture → parse → generate → compare
2. **Property preservation**: Parse JRXML → verify all element properties are captured in JSON
3. **Expression preservation**: Expressions like `$F{fieldName}` and `$P{paramName}` must survive parse→generate unchanged
4. **Table structure**: Complex table layouts with nested column groups must parse and regenerate correctly
5. **Style fidelity**: Named styles, conditional styles, box/border properties must round-trip

### 5.1 Known Round-Trip Risks

- **Whitespace normalization**: XML parsers may normalize whitespace in text content
- **Attribute ordering**: Generated XML may have different attribute order than input
- **Namespace prefixes**: Re-generated namespace prefixes may differ from original
- **UUID regeneration**: UUIDs may be regenerated on import (JasperReports accepts this)
- **Default value elision**: Properties at default values may be omitted in generated output

## 6. External Integration

### 6.1 PDF Preview Server

- **Endpoint**: `POST https://jrxml-pdf-preview.firegod.cn/api/pdf/generateForm`
- **Payload**: form-urlencoded with fields `jrxml`, `parameters` (JSON), `dataSource` (JSON)
- **Returns**: PDF binary content
- **Implementation**: `PdfPreviewModal.vue` creates a hidden `<form>` in a `data:` URI iframe that auto-submits
- **Source**: https://github.com/fengyunhe/jrxml_preview_server
