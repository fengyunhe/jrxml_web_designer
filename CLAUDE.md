# JRXML Web Designer

A browser-based visual designer for JasperReports JRXML templates, built with Vue 3 + TypeScript + Vite.

## Core Architecture

This is a **bidirectional JRXML designer**. The entire application revolves around three critical data transformations:

```
UI (Vue Canvas) ⇄ Structured JSON ⇄ JRXML (XML)
```

### Critical Path 1: JSON → JRXML (Generation)

- **Entry**: `src/utils/jrxmlGenerator.ts` → `generateJRXMLContent()`
- **XML header**: `src/utils/jrxml/xmlBuilder.ts` → `buildJasperReportOpenTag()`
- **Types**: `src/utils/jrxml/types.ts` (`ReportProperties`, `Field`, `Parameter`)
- Flattens the visual JSON model into JasperReports-compatible XML
- Handles all element types: staticText, textField, image, line, rectangle, ellipse, frame, table

### Critical Path 2: JRXML → JSON (Parsing)

- **Entry**: `src/utils/jrxml/parse.ts` → `parseJRXMLContent()`
- Uses browser `DOMParser` to parse XML
- Extracts: `properties`, `bands`, `fields`, `parameters`, `datasets`, `variables`, `styles`
- Handles multiple namespace resolution strategies (direct children, namespace-aware, localName)

### Critical Path 3: JSON → UI Binding (Designer Canvas)

- **Main component**: `src/components/PDFDesigner.vue` — the core orchestrator
- Vue 3 reactive refs hold the JSON model (`reportProperties`, `bands`, `fields`, etc.)
- Elements rendered in `src/components/designer/` sub-components
- Drag/drop, resize, selection all operate on the JSON model directly
- Changes to JSON immediately reflect in the visual canvas

### Round-Trip Integrity

The most important invariant: **edit in designer → export JRXML → re-import → should produce identical visual result**. Any bug in parse/generate/bind breaks this.

## JSON Data Model

The central data structures live in `src/types/index.ts`:

- `ReportProperties` — page size, margins, default font
- `Band` — layout region (title, detail, pageHeader, etc.) containing elements
- `DesignElement` — union of `StaticTextElement | TextFieldElement | ImageElement | LineElement | RectangleElement | EllipseElement | BreakElement | FrameElement | TableElement`
- `Field`, `ReportParameter`, `ReportVariable` — data model definitions
- `ReportStyle`, `ConditionalStyle` — style system

## Project Structure

```
jasperreport6Fork/           # OFFICIAL JasperReports Library source — REFERENCE ONLY, DO NOT MODIFY
├── ...                      # (JasperStudio Library fork, not part of this project)

src/
├── components/
│   ├── PDFDesigner.vue          # Main orchestrator component
│   ├── designer/                 # Canvas sub-components (elements, bands)
│   ├── modals/                   # PdfPreviewModal, PreviewServerSettingsModal, etc.
│   └── BottomPanel.vue           # Bottom toolbar with preview button
├── composables/                  # Vue composables (useLivePreview, etc.)
├── config/
│   └── apiConfig.ts             # API endpoint configuration
├── types/
│   └── index.ts                 # All TypeScript interfaces
├── utils/
│   ├── jrxml/
│   │   ├── parse.ts             # JRXML → JSON parser
│   │   ├── types.ts             # Parse/generate type definitions
│   │   ├── xmlBuilder.ts        # XML tag builder helpers
│   │   ├── validator.ts         # JRXML validation rules
│   │   └── officialCompiler.ts  # (if exists) Reference compiler
│   └── jrxmlGenerator.ts        # JSON → JRXML generator
├── test/
│   └── setup.ts                 # Vitest global mocks
└── tests/
    ├── *.jrxml                   # Fixture JRXML files for testing
    ├── unit/                     # Unit tests
    └── jrxml-pdf-preview.integration.test.ts  # Server integration tests
```

## Development Commands

```bash
npm run dev          # Start dev server (Vite)
npm run build        # Production build (vue-tsc + vite)
npm run test         # Run tests once (vitest)
npm run test:watch   # Watch mode
```

## Testing

- **Framework**: Vitest + jsdom + @vue/test-utils
- **Test files**: Co-located `*.test.ts` or under `tests/`
- **Fixtures**: `tests/*.jrxml` and `tests/build_by_*/`
- **Run specific**: `npx vitest run tests/path/to/file.test.ts`

## Key Conventions

- TypeScript strict mode
- Vue 3 `<script setup>` composition API
- No external state management library — reactive refs in components
- i18n via vue-i18n (zh-CN default)
- JRXML namespace: `http://jasperreports.sourceforge.net/jasperreports`
- Element UUIDs required by JasperReports XSD
