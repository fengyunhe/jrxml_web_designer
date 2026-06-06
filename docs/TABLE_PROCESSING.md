# Table Processing Technical Guide

## Overview

Tables are the most complex element type in the JRXML Web Designer. This document describes the current implementation of table handling, including complex scenarios like nested column groups, row merging (rowSpan), and height synchronization.

## Table Structure

### XML Format

```xml
<componentElement>
  <reportElement .../>
  <jr:table whenNoDataType="AllSectionsNoDetail">
    <datasetRun subDataset="...">
      <connectionExpression><![CDATA[$P{REPORT_CONNECTION}]]></connectionExpression>
    </datasetRun>
    
    <!-- Simple column -->
    <jr:column width="185">
      <jr:tableHeader height="30" rowSpan="2" style="Table_TH">...</jr:tableHeader>
      <jr:columnHeader height="15" rowSpan="1" style="Table_CH">...</jr:columnHeader>
      <jr:detailCell height="15" style="Table_TD">...</jr:detailCell>
      <jr:columnFooter height="15" style="Table_CH">...</jr:columnFooter>
      <jr:tableFooter height="15" style="Table_TH">...</jr:tableFooter>
    </jr:column>
    
    <!-- Column group with nested groups -->
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

### JSON Data Model

```typescript
interface TableElement {
  type: 'table';
  columns: TableColumn[];                    // Top-level flat array (for simple tables)
  children: (ColumnGroup | TableColumn)[];   // Nested structure (for grouped tables)
  dataset: TableDataset;
}

interface TableColumn {
  uuid: string;
  name: string;
  width: number;
  
  tableHeader?: {
    height: number;              // Actual merged height (singleHeight × rowSpan)
    rowSpan: number;             // Number of rows spanned (1 = no merge)
    element: {
      type: 'staticText' | 'textField';
      height: number;
      text?: string;
      expression?: string;
    };
  };
  
  columnHeader: {
    height: number;              // Actual merged height
    rowSpan: number;
    element: {
      type: 'staticText' | 'textField';
      height: number;
    };
  };
  
  detailCell: {
    height: number;              // Single row height (not multiplied by rowSpan)
    element: {
      type: 'staticText' | 'textField';
      height: number;
      expression?: string;
    };
  };
  
  columnFooter?: {
    height: number;
    rowSpan?: number;
    element: {
      type: 'staticText' | 'textField';
      height: number;
    };
  };
  
  tableFooter?: {
    height: number;
    rowSpan?: number;
    element: {
      type: 'staticText' | 'textField';
      height: number;
    };
  };
}

interface ColumnGroup {
  uuid: string;
  name: string;
  width: number;
  
  tableHeader?: {
    height: number;
    element: { height: number; };
  };
  
  columnHeader?: {
    height: number;
    element: { height: number; };
  };
  
  children: (ColumnGroup | TableColumn)[];
}
```

## Key Processing Logic

### 1. Column Merging (rowSpan)

#### Height Calculation

When a cell has `rowSpan > 1`, it spans multiple rows. The actual height must be:

```
Actual Height = Single Row Height × rowSpan
```

**Example:**
- Single row height: 15px
- rowSpan: 2
- Actual height: 30px

#### JRXML Generation

The generator must avoid double-multiplying the height:

```typescript
// In jrxmlGenerator.ts
if (chRowSpan > 1) {
  // Check if height is already merged (divisible by rowSpan)
  const isAlreadyMerged = columnHeader.height % chRowSpan === 0;
  
  if (!isAlreadyMerged) {
    // Still single height, multiply by rowSpan
    columnHeader.height *= chRowSpan;
  }
  // Otherwise, keep as-is (already correct merged height)
}
```

**Why this matters:**
- User sets column header height to 15
- System calculates merged height: 15 × 2 = 30
- If we multiply again during JRXML generation: 30 × 2 = 60 (WRONG!)
- Solution: Check if already merged before multiplying

### 2. Row Height Synchronization

When user changes a row height (e.g., detailCell from 15 to 20):

#### Step 1: Update tableRowHeights State

```typescript
// In ElementProperties.vue
const updateAllColumnRowHeights = () => {
  // Update all columns at top level
  if (currentElement.value.columns) {
    currentElement.value.columns.forEach((column) => {
      updateColumnRowHeights(column);
    });
  }
  
  // Update all nested column groups recursively
  if (currentElement.value.children) {
    currentElement.value.children.forEach((item) => {
      if ('children' in item) {
        updateGroupRowHeights(item);  // Recursive for nested groups
      } else {
        updateColumnRowHeights(item);
      }
    });
  }
};
```

#### Step 2: Update Individual Column

```typescript
const updateColumnRowHeights = (column: any) => {
  // Update detailCell height
  if (column.detailCell) {
    column.detailCell.height = tableRowHeights.value.detailCell;
    
    // Also update internal element height
    if (column.detailCell.element) {
      column.detailCell.element.height = tableRowHeights.value.detailCell;
    }
  }
  
  // For merged cells, calculate actual height
  if (column.columnHeader.rowSpan > 1) {
    const mergedHeight = tableRowHeights.value.columnHeader * column.columnHeader.rowSpan;
    column.columnHeader.height = mergedHeight;
  } else {
    column.columnHeader.height = tableRowHeights.value.columnHeader;
  }
  
  // ... similar for other cell types
};
```

#### Step 3: Recursive Group Processing

```typescript
const updateGroupRowHeights = (group: any) => {
  // Update group's own tableHeader, columnHeader, etc.
  if (group.columnHeader) {
    const columnHeaderHeight = tableRowHeights.value.columnHeader;
    group.columnHeader.height = columnHeaderHeight;
    
    // Handle merged columns in group
    if (group.columnHeader.rowSpan > 1) {
      group.columnHeader.height = columnHeaderHeight * group.columnHeader.rowSpan;
    }
  }
  
  // Recursively update nested groups
  if (group.children) {
    group.children.forEach((child: any) => {
      if (child.children) {
        updateGroupRowHeights(child);  // Nested group
      } else {
        updateColumnRowHeights(child); // Regular column
      }
    });
  }
};
```

### 3. Height Tracking in Designer Canvas

#### allColumnsForHeight Computed Property

Collects all columns (including nested in groups) for height calculation:

```typescript
const allColumnsForHeight = computed(() => {
  const result: any[] = [];
  
  function extractColumns(items: any[]) {
    if (!items) return;
    items.forEach((item: any) => {
      if ('detailCell' in item) {
        result.push(item);  // Regular column
      } else if ('children' in item) {
        extractColumns(item.children);  // Nested group
      }
    });
  }
  
  // Collect from columns array
  if (tableElement.value.columns) {
    result.push(...tableElement.value.columns);
  }
  
  // Collect from children array (for grouped tables)
  if (tableElement.value.children) {
    extractColumns(tableElement.value.children);
  }
  
  return result;
});
```

#### getMaxCellHeight Function

Finds maximum height across all cells of the same type:

```typescript
function getMaxCellHeight(getCell: (col: any) => any): number {
  const cols = allColumnsForHeight.value;
  let maxH = 0;
  
  for (const col of cols) {
    const cell = getCell(col);
    const h = cell?.element?.height;
    if (h && h > maxH) maxH = h;
  }
  
  return maxH || 30;  // Default to 30 if not set
}

// Usage:
const detailCellHeight = computed(() =>
  getMaxCellHeight((col) => col.detailCell)
);
```

#### Rendering

The computed heights are applied via inline styles:

```vue
<template>
  <tr class="cellDetail" :style="{ height: `${detailCellHeight}px` }">
    <td v-for="column in columns" :key="column.uuid"
        :style="{ width: `${column.width}px` }">
      <!-- cell content -->
    </td>
  </tr>
</template>
```

## CSS Styling

### Key CSS Rules

```css
/* Prevent table from being stretched by content */
.designer-table {
  width: 100%;
  table-layout: fixed;  /* Fixed layout, prevents columns from expanding */
  border-collapse: collapse;
}

/* No default heights - all heights come from JSON data */
.tableHeader,
.columnHeader,
.cellDetail,
.columnFooter,
.tableFooter {
  /* No height property here! */
  position: relative;
  overflow: hidden;  /* Prevent content from expanding row */
}

/* Prevent table content from stretching vertically */
.designer-table tbody {
  vertical-align: top;
}

.designer-table tr {
  vertical-align: top;
}

.designer-table td {
  vertical-align: top;
  height: inherit;      /* Inherit row height */
  max-height: inherit;  /* Inherit max height constraint */
}

/* Cell content styling */
.cell-content {
  width: 100%;
  height: 100%;
  min-height: auto;  /* Don't use 100% - prevents stretching */
  display: flex;
  align-items: center;
  overflow: hidden;
}
```

### Why These Styles Matter

1. **`table-layout: fixed`**: Forces columns to use declared widths, prevents content from expanding columns
2. **No default heights**: All heights must come from JSON data to ensure consistency
3. **`vertical-align: top`**: Prevents table cells from being stretched vertically by the table's height
4. **`overflow: hidden`**: Prevents content from expanding row heights
5. **`min-height: auto`**: Prevents flex items from stretching their containers

## Complex Scenarios

### Scenario 1: Nested Column Groups

```
Table
├── Column Group A (width: 400)
│   ├── Column A1 (width: 200)
│   └── Column A2 (width: 200)
└── Column B (width: 200)
```

**Processing:**
1. `updateAllColumnRowHeights()` iterates over `table.children`
2. Finds Column Group A, calls `updateGroupRowHeights(groupA)`
3. `updateGroupRowHeights()` recursively calls `updateColumnRowHeights()` on A1 and A2
4. Then processes Column B directly
5. All heights are synchronized across the entire table

### Scenario 2: Multi-Level rowSpan

```
TableHeader rowSpan=3 (spans 3 rows)
├── Row 1: Column Group Header
├── Row 2: Sub-group Header
└── Row 3: Column Header
```

**Height Calculation:**
- Single row height: 10px
- TableHeader rowSpan: 3
- Actual TableHeader height: 30px

**JRXML Generation:**
```xml
<jr:tableHeader height="30" rowSpan="3" style="Table_TH">
  <!-- Content -->
</jr:tableHeader>
```

### Scenario 3: Asymmetric Merging

Different columns can have different rowSpan values:

```
Column 1: columnHeader rowSpan=1 (height: 15px)
Column 2: columnHeader rowSpan=2 (height: 30px)
Column 3: columnHeader rowSpan=1 (height: 15px)
```

**Handling:**
- `getMaxCellHeight()` finds max height across all columns of same type
- In this case: max(columnHeaders) = 30px
- Row height displayed in UI: 30px
- Each column's actual height preserved in JSON

## Comparison with JasperStudio

### Feature Parity

| Feature | JasperStudio | Web Designer | Status |
|---------|:-----------:|:------------:|--------|
| Basic table creation | ✅ | ✅ | Complete |
| Column add/delete/reorder | ✅ | ✅ | Complete |
| Column width resize | ✅ | ✅ | Complete |
| Column groups (nested) | ✅ | ✅ | Complete |
| rowSpan (cell merging) | ✅ | ✅ | Complete |
| Row height configuration | ✅ | ✅ | Complete |
| Height sync across columns | ✅ | ✅ | Complete |
| Recursive group processing | ✅ | ✅ | Complete |
| Table styles | ✅ | ✅ | Complete |
| Cell content alignment | ✅ | ✅ | Complete |
| Cell borders | ✅ | ✅ | Complete |
| Dataset support | ✅ | ✅ | Complete |
| Dynamic columns | ✅ | ❌ | Not implemented |
| Row groups | ✅ | ❌ | Not implemented |
| Table calculations | ✅ | ❌ | Not implemented |

### Technical Differences

1. **Height Handling**: Web Designer separates "configured height" from "merged height", while JasperStudio may handle this differently internally
2. **CSS Rendering**: Web Designer uses CSS flexbox/grid, requiring careful height constraint management
3. **Reactivity**: Web Designer uses Vue's reactive system for immediate UI updates, while JasperStudio uses Eclipse SWT

### Known Limitations

1. **No dynamic columns**: Cannot add/remove columns at runtime based on data
2. **No row groups**: Cannot group rows by data values (only column groups supported)
3. **No table calculations**: Cannot define calculated fields within the table

## Best Practices

### For Users

1. **Set heights consistently**: Use the same row height for all columns in the same row type
2. **Understand rowSpan**: Remember that merged cell height = single height × rowSpan
3. **Test with preview**: Always preview in PDF to verify height rendering matches design

### For Developers

1. **Never use CSS default heights**: All heights must come from JSON data
2. **Avoid height multiplication bugs**: Check if height is already merged before multiplying
3. **Use recursive processing**: Handle nested groups with recursive functions
4. **Track processed columns**: Use Set to avoid duplicate processing
5. **Force Vue updates**: Use computed properties with proper dependencies for reactive height tracking

## Testing

### Test Cases

1. **Basic table**: Single column, no merging
2. **Merged columns**: Column with rowSpan > 1
3. **Nested groups**: Multiple levels of column groups
4. **Height changes**: Modify row height and verify all cells update
5. **JRXML round-trip**: Parse → Generate → Parse should preserve heights
6. **PDF preview**: Verify rendered heights match design canvas

### Known Issues

- None currently documented (all recent issues have been resolved)

## References

- JasperReports Library Source: `jasperreport6Fork/`
- Main Generator: `src/utils/jrxmlGenerator.ts`
- Main Parser: `src/utils/jrxml/parse.ts`
- Table Properties UI: `src/components/designer/properties/ElementProperties.vue`
- Table Canvas Rendering: `src/components/elements/TableElement.vue`
