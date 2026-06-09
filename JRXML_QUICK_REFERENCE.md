# JRXML Quick Reference Card

## Critical Rules

### 1. Child Element Order (XSD Strict)
```
jasperReport →
  1. properties
  2. propertyExpressions
  3. imports
  4. templates
  5. reportFonts
  6. styles
  7. subDatasets
  8. scriptlets
  9. parameters
  10. queryString
  11. fields
  12. sortFields
  13. variables
  14. filterExpression
  15. groups
  16-25. Bands (background → title → pageHeader → columnHeader → detail → columnFooter → pageFooter → lastPageFooter → summary → noData)
```

### 2. Required Attributes
**jasperReport**: `name` (required)

**All design elements**: `x`, `y`, `width`, `height` (required)

**Parameters/Fields/Variables**: `name`, `class` (required)

**Groups**: `name` (required)

### 3. UUID Requirements
✅ Always generate UUIDs for:
- JasperReport root element
- Bands
- Design elements
- Parameters
- Fields
- Variables
- Styles

Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (lowercase hex)

---

## Table/Crosstab Components

### Column Attributes (Source Code)
```xml
<column width="150" weight="1">
  <!-- width: column width in points -->
  <!-- weight: proportional sizing factor (6.21.5+) -->
</column>
```

### ColumnGroup Attributes (Source Code)
```xml
<columnGroup name="group1" width="200" weight="2">
  <!-- width: group header width -->
  <!-- weight: proportional sizing factor -->
</columnGroup>
```

---

## Common Attribute Values

### Enums
| Attribute | Valid Values |
|-----------|-------------|
| printOrder | Vertical, Horizontal |
| columnDirection | LTR, RTL |
| orientation | Portrait, Landscape |
| whenNoDataType | NoPages, BlankPage, AllSectionsNoDetail, NoDataSection |
| mode | Opaque, Transparent |
| positionType | FixRelativeToBand, Float |
| splitType | Immediate, Stretch, Prevent |
| calculation | Nothing, Count, Sum, Average, Lowest, Highest, StandardDeviation, Variance, System, First, CumulativeCount, CumulativeSum, CumulativeAverage |
| resetType | None, Report, Page, Column, Group |
| scaleImage | Clip, FillFrame, RetainImage, RealHeight, RealSize |
| textAlignment | Left, Center, Right, Justified |
| verticalAlignment | Top, Middle, Bottom |
| rotation | None, Left, Right, UpsideDown |

### Data Types (Class Attribute)
```
java.lang.String (default)
java.lang.Boolean
java.lang.Byte
java.lang.Short
java.lang.Integer
java.lang.Long
java.lang.Float
java.lang.Double
java.math.BigDecimal
java.util.Date
java.sql.Time
java.sql.Timestamp
```

---

## Format Patterns

### Numbers
```
#,##0              → 1,234
#,##0.00           → 1,234.56
#,##0.##           → 1,234.5
$#,##0.00          → $1,234.56
#,##0.00%          → 12.34%
```

### Dates
```
yyyy-MM-dd         → 2026-06-09
MM/dd/yyyy         → 06/09/2026
dd/MM/yyyy         → 09/06/2026
yyyy-MM-dd HH:mm:ss → 2026-06-09 14:30:00
```

---

## Example: Minimal JRXML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              name="TestReport"
              pageWidth="595"
              pageHeight="842"
              columnWidth="555"
              leftMargin="20"
              rightMargin="20"
              topMargin="30"
              bottomMargin="30">
  
  <field name="fieldName" class="java.lang.String"/>
  
  <detail>
    <band height="30">
      <textField>
        <reportElement x="0" y="0" width="200" height="20"/>
        <textFieldExpression><![CDATA[$F{fieldName}]]></textFieldExpression>
      </textField>
    </band>
  </detail>
  
</jasperReport>
```

---

## Common Mistakes to Avoid

❌ **Wrong**: Properties before reportFont
❌ **Wrong**: Bands before fields/variables
❌ **Wrong**: Missing required attributes (x, y, width, height)
❌ **Wrong**: String values for numeric attributes
❌ **Wrong**: Incorrect enum values (e.g., "vertical" instead of "Vertical")
❌ **Wrong**: Missing UUIDs in strict validation mode

✅ **Correct**: Follow XSD element ordering
✅ **Correct**: Include all required attributes
✅ **Correct**: Use proper types (integer for dimensions)
✅ **Correct**: Generate UUIDs for all major elements
✅ **Correct**: Use exact enum values (case-sensitive)

---

## Validation Checklist

Before outputting JRXML, verify:
- [ ] Element ordering matches XSD sequence
- [ ] All required attributes present
- [ ] Attribute types correct (integer, string, boolean, enum)
- [ ] Enum values are valid
- [ ] UUIDs generated for all major elements
- [ ] Format patterns valid for data types
- [ ] Expressions use correct syntax ($F{}, $V{}, $P{})
- [ ] No duplicate element names
- [ ] Band heights are positive integers
- [ ] Element positions within band bounds

---

*Quick Reference Card - Keep this handy when working with JRXML generation*
