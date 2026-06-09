# JRXML Generator Implementation Plan

## Current Status

### ✅ Completed
1. Created JSON Schema specification (`schemas/jrxml-schema.json`)
2. Generated comprehensive reference documentation (`jrxml_reference.md`)
3. Performed compliance analysis (`CODE_COMPLIANCE_CHECK.md`)
4. Created UUID generator utility (`src/utils/jrxml/uuidGenerator.ts`)

### 🔄 In Progress
1. Refactor `generateJRXMLContent()` to follow XSD element ordering
2. Add UUID generation to all major elements
3. Test changes against JSON Schema

### ⏳ Pending
1. Update element generation functions to include UUIDs
2. Create validation layer
3. Write unit tests

---

## Key Changes to Implement

### 1. Element Ordering Fix

**Problem**: Current order doesn't match XSD specification.

**Current Order**:
```
jasperReport
├── reportFont (WRONG - should be after styles)
├── properties
├── styles
├── parameters
├── queryString
├── subDatasets
├── fields
├── variables
└── groups → bands
```

**Correct Order** (XSD-compliant):
```
jasperReport
├── properties (1)
├── propertyExpressions (2) - not yet implemented
├── imports (3) - not yet implemented
├── templates (4) - not yet implemented
├── reportFonts (5) ← MOVED
├── styles (6)
├── subDatasets (7) ← MOVED
├── scriptlets (8) - not yet implemented
├── parameters (9) ← MOVED
├── queryString (10)
├── fields (11)
├── sortFields (12) - not yet implemented
├── variables (13)
├── filterExpression (14) - not yet implemented
├── groups (15)
├── background (16)
├── title (17)
├── pageHeader (18)
├── columnHeader (19)
├── detail (20)
├── columnFooter (21)
├── pageFooter (22)
├── lastPageFooter (23)
├── summary (24)
└── noData (25)
```

### 2. UUID Generation

**Current**: No UUIDs generated for most elements.

**Required**: UUIDs for:
- JasperReport root element
- All bands
- All design elements
- Parameters
- Fields
- Variables
- Styles

**Implementation**:
```typescript
import { generateUUID } from './jrxml/uuidGenerator';

// Example usage
const uuid = generateUUID();
```

### 3. Attribute Enhancement

**Add to parameter generation**:
```typescript
<parameter name="${param.name}" class="${param.class}" uuid="${generateUUID()}">
```

**Add to field generation**:
```typescript
<field name="${field.name}" class="${field.class}" uuid="${generateUUID()}">
```

**Add to variable generation**:
```typescript
<variable name="${variable.name}" class="${variable.class}" uuid="${generateUUID()}" ...>
```

**Add to band generation**:
```typescript
<band height="${band.height}" uuid="${generateUUID()}" ...>
```

---

## Implementation Steps

### Step 1: Import UUID Generator

Add to `src/utils/jrxmlGenerator.ts`:
```typescript
import { generateUUID } from './jrxml/uuidGenerator';
```

### Step 2: Refactor generateJRXMLContent()

Rewrite the function to follow XSD element ordering with these sections:

1. **Build root element tag**
2. **Add properties** (property elements)
3. **Add reportFonts** (before styles)
4. **Add styles** (after reportFonts)
5. **Add subDatasets** (after styles, before parameters)
6. **Add parameters** (after subDatasets)
7. **Add queryString** (after parameters)
8. **Add fields** (after queryString)
9. **Add variables** (after fields)
10. **Add groups** (after variables)
11. **Add bands** (after groups)

### Step 3: Update Element Generators

Update these functions to include UUID:
- `generateStaticTextXML()`
- `generateTextFieldXML()`
- `generateImageXML()`
- `generateLineXML()`
- `generateRectangleXML()`
- `generateEllipseXML()`
- `generateFrameXML()`
- `generateTableXML()`
- `generateBoxXML()` - if needed

### Step 4: Add Validation Layer

Create optional validation before output:
```typescript
import Ajv from 'ajv';
import schema from '../schemas/jrxml-schema.json';

export function generateJRXMLWithValidation(...args): { jrxml: string; errors: any[] } {
  // Generate JSON model
  const model = buildJRXMLModel(...args);
  
  // Validate
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  const valid = validate(model);
  
  if (!valid) {
    console.warn('JRXML validation warnings:', validate.errors);
  }
  
  // Generate JRXML
  const jrxml = generateJRXMLFromModel(model);
  
  return { jrxml, errors: validate.errors || [] };
}
```

---

## Testing Strategy

### Test 1: Element Ordering
```typescript
const jrxml = generateJRXMLContent(properties, bands, fields, parameters);

// Verify order
const reportFontIndex = jrxml.indexOf('<reportFont');
const propertiesIndex = jrxml.indexOf('<property');
const stylesIndex = jrxml.indexOf('<style');
const parametersIndex = jrxml.indexOf('<parameter');
const queryStringIndex = jrxml.indexOf('<queryString');
const fieldsIndex = jrxml.indexOf('<field');
const variablesIndex = jrxml.indexOf('<variable');

// Should be: properties < reportFont < styles < parameters < queryString < fields < variables
expect(propertiesIndex).toBeLessThan(reportFontIndex);
expect(reportFontIndex).toBeLessThan(stylesIndex);
expect(stylesIndex).toBeLessThan(parametersIndex);
expect(parametersIndex).toBeLessThan(queryStringIndex);
expect(queryStringIndex).toBeLessThan(fieldsIndex);
expect(fieldsIndex).toBeLessThan(variablesIndex);
```

### Test 2: UUID Generation
```typescript
const jrxml = generateJRXMLContent(properties, bands, fields, parameters);

// Check for UUID attributes
const uuidRegex = /uuid="[^"]*"/g;
const uuids = jrxml.match(uuidRegex);

expect(uuids.length).toBeGreaterThan(0);

// Validate UUID format
uuids.forEach(uuidMatch => {
  const uuid = uuidMatch.replace('uuid="', '').replace('"', '');
  expect(isValidUUID(uuid)).toBe(true);
});
```

### Test 3: Schema Validation
```typescript
import Ajv from 'ajv';
import schema from '../schemas/jrxml-schema.json';

const model = buildJRXMLModel(properties, bands, fields, parameters);
const ajv = new Ajv();
const validate = ajv.compile(schema);
const valid = validate(model);

expect(valid).toBe(true);
```

---

## Files to Modify

### High Priority
1. **`src/utils/jrxmlGenerator.ts`** - Main refactoring
   - Import UUID generator
   - Rewrite `generateJRXMLContent()` with correct order
   - Add UUIDs to all elements

2. **`src/utils/jrxml/uuidGenerator.ts`** - ✅ Created

3. **Element generators** - Add UUIDs to:
   - `generateStaticTextXML()`
   - `generateTextFieldXML()`
   - `generateImageXML()`
   - etc.

### Medium Priority
4. **Create validation layer** - Optional validation before output
5. **Update types** - Add UUID field to type definitions

### Low Priority
6. **Create unit tests** - Test element ordering and UUID generation
7. **Update documentation** - Document changes and usage

---

## Expected Outcomes

After implementation:
- ✅ JRXML will be 100% XSD-compliant for element ordering
- ✅ All major elements will have UUIDs
- ✅ Generated JRXML will pass JSON Schema validation
- ✅ Generated JRXML will be accepted by JasperReports in strict validation mode

---

## Timeline

**Estimated Time**: 2-3 hours for core changes + 1-2 hours for testing

**Phase 1** (30 mins): Import UUID generator and refactor element ordering
**Phase 2** (45 mins): Add UUIDs to all element generators
**Phase 3** (30 mins): Create validation layer
**Phase 4** (45 mins): Write and run tests

---

*Implementation Plan - Ready for execution*
