/**
 * JRXML HTML渲染器 - TypeScript实现
 * 将设计器内部数据模型渲染为HTML预览
 */

import type { Band, DesignElement, ReportProperties, StaticTextElement, TextFieldElement, ImageElement, LineElement, RectangleElement, EllipseElement, FrameElement, Box, Pen } from '@/types';
import { parseJRXMLContent } from './jrxmlGenerator';

export interface HtmlRendererOptions {
  scale?: number;
  showBorders?: boolean;
  showElementBorders?: boolean;
  showBandLabels?: boolean;
}

const BAND_DISPLAY_NAMES: Record<string, string> = {
  title: '标题',
  pageHeader: '页头',
  columnHeader: '列头',
  detail: '明细',
  columnFooter: '列尾',
  pageFooter: '页脚',
  summary: '汇总',
  background: '背景',
  lastPageFooter: '末页页脚',
  noData: '无数据',
};

const BAND_ORDER = ['title', 'pageHeader', 'columnHeader', 'detail', 'columnFooter', 'pageFooter', 'summary', 'background'];

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildFontStyle(element: DesignElement, scale: number): string {
  let style = '';
  if (element.fontFamily) {
    style += `font-family: '${element.fontFamily}', Arial, sans-serif;`;
  }
  if (element.fontSize) {
    style += `font-size: ${element.fontSize * scale}px;`;
  }
  if (element.isBold) {
    style += 'font-weight: bold;';
  }
  if (element.isItalic) {
    style += 'font-style: italic;';
  }
  if (element.isUnderline) {
    style += 'text-decoration: underline;';
  }
  return style;
}

function buildBoxStyle(box: Box): string {
  let style = '';

  // Global border
  if (box.borderWidth || box.border) {
    const width = box.borderWidth ?? 1;
    const bStyle = box.borderStyle ?? 'solid';
    const color = box.borderColor ?? '#000';
    style += `border: ${width}px ${bStyle} ${color};`;
  }

  // Per-side borders
  const sides = ['top', 'left', 'bottom', 'right'] as const;
  for (const side of sides) {
    const pen = box[`${side}Pen` as keyof Box] as Pen | undefined;
    if (pen) {
      const w = pen.lineWidth ?? 1;
      const s = pen.lineStyle === 'Dashed' ? 'dashed' : pen.lineStyle === 'Dotted' ? 'dotted' : 'solid';
      const c = pen.lineColor ?? '#000';
      style += `border-${side}: ${w}px ${s} ${c};`;
    }
  }

  // Padding
  if (box.topPadding) style += `padding-top: ${box.topPadding}px;`;
  if (box.leftPadding) style += `padding-left: ${box.leftPadding}px;`;
  if (box.bottomPadding) style += `padding-bottom: ${box.bottomPadding}px;`;
  if (box.rightPadding) style += `padding-right: ${box.rightPadding}px;`;

  return style;
}

function buildElementBaseStyle(element: DesignElement, scale: number, showElementBorders: boolean): string {
  let style = `
    position: absolute;
    left: ${element.x * scale}px;
    top: ${element.y * scale}px;
    width: ${element.width * scale}px;
    height: ${element.height * scale}px;
    box-sizing: border-box;
  `;

  if (element.mode === 'Opaque' && element.backcolor) {
    style += `background-color: ${element.backcolor};`;
  }
  if (element.forecolor) {
    style += `color: ${element.forecolor};`;
  }
  if (showElementBorders) {
    style += 'border: 1px solid #ddd;';
  }
  if (element.box) {
    style += buildBoxStyle(element.box);
  }

  return style;
}

function buildTextStyle(element: DesignElement): string {
  let style = '';

  if (element.textAlignment) {
    const alignMap: Record<string, string> = { Left: 'left', Center: 'center', Right: 'right', Justified: 'justify' };
    style += `text-align: ${alignMap[element.textAlignment] || 'left'};`;
  }

  if (element.verticalAlignment) {
    const valignMap: Record<string, string> = { Top: 'flex-start', Middle: 'center', Bottom: 'flex-end' };
    style += `display: flex; align-items: ${valignMap[element.verticalAlignment] || 'flex-start'};`;
  }

  if (element.textAdjust) {
    switch (element.textAdjust) {
      case 'StretchHeight': style += 'overflow: visible;'; break;
      case 'CutText': style += 'overflow: hidden;'; break;
      case 'ShrinkToFit': style += 'overflow: hidden; white-space: nowrap;'; break;
    }
  }

  if ('rotation' in element && element.rotation) {
    switch (element.rotation) {
      case 'Left': style += 'transform: rotate(-90deg);'; break;
      case 'Right': style += 'transform: rotate(90deg);'; break;
    }
  }

  return style;
}

function renderStaticText(element: StaticTextElement, baseStyle: string, scale: number): string {
  const fontStyle = buildFontStyle(element, scale);
  const textStyle = buildTextStyle(element);
  return `<div class="element static-text" style="${baseStyle}${textStyle}"><span style="${fontStyle}">${escapeHtml(element.text || '')}</span></div>`;
}

function renderTextField(element: TextFieldElement, baseStyle: string, scale: number): string {
  const fontStyle = buildFontStyle(element, scale);
  const textStyle = buildTextStyle(element);
  const displayText = element.expression || '[空表达式]';
  const patternHtml = element.pattern ? `<span style="font-size:10px;color:#999;"> [${escapeHtml(element.pattern)}]</span>` : '';
  return `<div class="element text-field" style="${baseStyle}${textStyle}"><span style="${fontStyle}color:#1890ff;">${escapeHtml(displayText)}</span>${patternHtml}</div>`;
}

function renderImage(element: ImageElement, baseStyle: string, scale: number): string {
  let scaleStyle = 'object-fit: contain;';
  if (element.scaleType === 'FillFrame' || element.scaleImage === 'FillFrame') scaleStyle = 'object-fit: fill;';
  else if (element.scaleType === 'RealSize' || element.scaleType === 'RealHeight') scaleStyle = 'object-fit: none;';
  else if (element.scaleType === 'Clip') scaleStyle = 'object-fit: none; overflow: hidden;';

  let alignStyle = '';
  if (element.hAlign) {
    const map: Record<string, string> = { Left: 'flex-start', Center: 'center', Right: 'flex-end' };
    alignStyle += `justify-content: ${map[element.hAlign] || 'flex-start'};`;
  }
  if (element.vAlign) {
    const map: Record<string, string> = { Top: 'flex-start', Middle: 'center', Bottom: 'flex-end' };
    alignStyle += `align-items: ${map[element.vAlign] || 'flex-start'};`;
  }

  const expr = ('imageExpression' in element && element.imageExpression) || ('expression' in element && (element as any).expression) || '未指定';
  return `<div class="element image" style="${baseStyle}display:flex;${alignStyle}"><div style="width:100%;height:100%;background:#f5f5f5;display:flex;align-items:center;justify-content:center;color:#999;font-size:${12 * scale}px;${scaleStyle}">[图片: ${escapeHtml(expr)}]</div></div>`;
}

function renderLine(element: LineElement, scale: number): string {
  const lineWidth = (element.lineWidth || 1) * scale;
  const isHorizontal = element.width > element.height;
  const innerStyle = isHorizontal
    ? `width:100%;height:${lineWidth}px;border-top:${lineWidth}px solid ${element.forecolor || '#000'};margin-top:${-lineWidth / 2}px;`
    : `height:100%;width:${lineWidth}px;border-left:${lineWidth}px solid ${element.forecolor || '#000'};margin-left:${-lineWidth / 2}px;`;

  return `<div class="element line" style="position:absolute;left:${element.x * scale}px;top:${element.y * scale}px;width:${element.width * scale}px;height:${element.height * scale}px;overflow:visible;"><div style="${innerStyle}"></div></div>`;
}

function renderRectangle(element: RectangleElement, baseStyle: string, scale: number): string {
  const radius = (element.radius || 0) * scale;
  let extra = '';
  if (radius > 0) extra += `border-radius:${radius}px;`;
  if (element.fill === 'Solid' && element.backcolor) extra += `background-color:${element.backcolor};`;
  return `<div class="element rectangle" style="${baseStyle}${extra}"></div>`;
}

function renderEllipse(_element: EllipseElement, baseStyle: string): string {
  return `<div class="element ellipse" style="${baseStyle}border-radius:50%;"></div>`;
}

function renderFrame(element: FrameElement, baseStyle: string, scale: number, showElementBorders: boolean): string {
  let childrenHtml = '';
  if (element.elements && element.elements.length > 0) {
    for (const child of element.elements) {
      childrenHtml += renderElement(child, scale, showElementBorders);
    }
  }
  return `<div class="element frame" style="${baseStyle}position:relative;">${childrenHtml}</div>`;
}

function renderElement(element: DesignElement, scale: number, showElementBorders: boolean): string {
  const baseStyle = buildElementBaseStyle(element, scale, showElementBorders);

  switch (element.type) {
    case 'staticText': return renderStaticText(element, baseStyle, scale);
    case 'textField': return renderTextField(element, baseStyle, scale);
    case 'image': return renderImage(element, baseStyle, scale);
    case 'line': return renderLine(element, scale);
    case 'rectangle': return renderRectangle(element, baseStyle, scale);
    case 'ellipse': return renderEllipse(element, baseStyle);
    case 'frame': return renderFrame(element, baseStyle, scale, showElementBorders);
    default: return '';
  }
}

function renderBand(bandType: string, band: Band, scale: number, showBorders: boolean, showElementBorders: boolean, showBandLabels: boolean): string {
  const scaledHeight = band.height * scale;
  const bandLabel = showBandLabels
    ? `<div style="position:absolute;left:-${scale * 5}px;top:0;transform:translateX(-100%);font-size:${10 * scale}px;color:#999;white-space:nowrap;">${BAND_DISPLAY_NAMES[bandType] || bandType}</div>`
    : '';
  const borderStyle = showBorders ? 'border-bottom:1px dashed #e0e0e0;' : '';

  let elementsHtml = '';
  if (band.elements && band.elements.length > 0) {
    for (const element of band.elements) {
      elementsHtml += renderElement(element, scale, showElementBorders);
    }
  }

  return `<div class="band band-${bandType}" style="position:relative;height:${scaledHeight}px;width:100%;${borderStyle}">${bandLabel}${elementsHtml}</div>`;
}

/**
 * 将内部数据模型渲染为完整HTML页面
 */
export function renderToHtml(
  bands: Band[],
  reportProperties: ReportProperties,
  options?: HtmlRendererOptions
): string {
  const opts: Required<HtmlRendererOptions> = {
    scale: options?.scale ?? 1,
    showBorders: options?.showBorders ?? true,
    showElementBorders: options?.showElementBorders ?? true,
    showBandLabels: options?.showBandLabels ?? true,
  };

  const { pageWidth, pageHeight, leftMargin, rightMargin, topMargin, bottomMargin } = reportProperties;

  const bandsMap: Record<string, Band> = {};
  for (const band of bands) {
    bandsMap[band.type] = band;
  }

  let bandsHtml = '';
  for (const bandType of BAND_ORDER) {
    if (bandsMap[bandType]) {
      bandsHtml += renderBand(bandType, bandsMap[bandType], opts.scale, opts.showBorders, opts.showElementBorders, opts.showBandLabels);
    }
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body{margin:0;padding:20px;background:#f0f0f0;display:flex;justify-content:center;}
  .jasper-report{
    width:${pageWidth * opts.scale}px;
    min-height:${pageHeight * opts.scale}px;
    background:white;
    position:relative;
    box-shadow:0 2px 8px rgba(0,0,0,0.15);
    font-family:Arial,sans-serif;
  }
  .page-content{
    padding:${topMargin * opts.scale}px ${rightMargin * opts.scale}px ${bottomMargin * opts.scale}px ${leftMargin * opts.scale}px;
    position:relative;
    min-height:${(pageHeight - topMargin - bottomMargin) * opts.scale}px;
  }
</style></head>
<body>
<div class="jasper-report">
  <div class="page-content">${bandsHtml}</div>
</div>
</body></html>`;
}

/**
 * 从JRXML字符串直接渲染为HTML
 */
export function renderJRXMLToHtml(jrxmlContent: string, options?: HtmlRendererOptions): string {
  const { properties, bands } = parseJRXMLContent(jrxmlContent);
  return renderToHtml(bands, properties as unknown as ReportProperties, options);
}

/**
 * 渲染为多页HTML预览
 * 将内容分页显示，带页面导航
 */
export function renderToMultiPageHtml(
  bands: Band[],
  reportProperties: ReportProperties,
  options?: HtmlRendererOptions
): { pages: string[]; totalPages: number } {
  const opts: Required<HtmlRendererOptions> = {
    scale: options?.scale ?? 1,
    showBorders: options?.showBorders ?? true,
    showElementBorders: options?.showElementBorders ?? true,
    showBandLabels: options?.showBandLabels ?? true,
  };

  const { pageWidth, pageHeight, leftMargin, rightMargin, topMargin, bottomMargin } = reportProperties;
  const contentHeight = pageHeight - topMargin - bottomMargin;

  const bandsMap: Record<string, Band> = {};
  for (const band of bands) {
    bandsMap[band.type] = band;
  }

  // Calculate fixed band heights
  const fixedBandTypes = ['title', 'pageHeader', 'columnHeader', 'columnFooter', 'pageFooter', 'summary'];
  let fixedHeight = 0;
  for (const bt of fixedBandTypes) {
    if (bandsMap[bt]) {
      fixedHeight += bandsMap[bt].height;
    }
  }

  // Calculate available space for detail rows
  const detailBand = bandsMap['detail'];
  const detailHeight = detailBand?.height || 30;
  const availableForDetail = contentHeight - fixedHeight;
  const detailRowsPerPage = Math.max(1, Math.floor(availableForDetail / detailHeight));

  // Determine total pages based on detail rows
  const detailElements = detailBand?.elements || [];
  const totalDetailRows = Math.max(1, detailElements.length > 0 ? detailRowsPerPage : 0);
  const totalPages = Math.max(1, totalDetailRows > 0 ? Math.ceil(detailElements.length / detailRowsPerPage) : 1);

  const pages: string[] = [];

  for (let page = 0; page < totalPages; page++) {
    let bandsHtml = '';

    // Title only on first page
    if (page === 0 && bandsMap['title']) {
      bandsHtml += renderBand('title', bandsMap['title'], opts.scale, opts.showBorders, opts.showElementBorders, opts.showBandLabels);
    }

    // Page header on every page
    if (bandsMap['pageHeader']) {
      bandsHtml += renderBand('pageHeader', bandsMap['pageHeader'], opts.scale, opts.showBorders, opts.showElementBorders, opts.showBandLabels);
    }

    // Column header on every page
    if (bandsMap['columnHeader']) {
      bandsHtml += renderBand('columnHeader', bandsMap['columnHeader'], opts.scale, opts.showBorders, opts.showElementBorders, opts.showBandLabels);
    }

    // Detail rows for this page
    if (detailBand) {
      const startRow = page * detailRowsPerPage;
      const endRow = Math.min(startRow + detailRowsPerPage, detailElements.length);
      const pageDetailBand: Band = {
        ...detailBand,
        elements: detailElements.slice(startRow, endRow),
        height: (endRow - startRow) * detailHeight
      };
      bandsHtml += renderBand('detail', pageDetailBand, opts.scale, opts.showBorders, opts.showElementBorders, opts.showBandLabels);
    }

    // Column footer on every page
    if (bandsMap['columnFooter']) {
      bandsHtml += renderBand('columnFooter', bandsMap['columnFooter'], opts.scale, opts.showBorders, opts.showElementBorders, opts.showBandLabels);
    }

    // Page footer on every page
    if (bandsMap['pageFooter']) {
      bandsHtml += renderBand('pageFooter', bandsMap['pageFooter'], opts.scale, opts.showBorders, opts.showElementBorders, opts.showBandLabels);
    }

    // Summary only on last page
    if (page === totalPages - 1 && bandsMap['summary']) {
      bandsHtml += renderBand('summary', bandsMap['summary'], opts.scale, opts.showBorders, opts.showElementBorders, opts.showBandLabels);
    }

    const pageHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body{margin:0;padding:0;background:#f0f0f0;display:flex;justify-content:center;}
  .jasper-report{
    width:${pageWidth * opts.scale}px;
    min-height:${pageHeight * opts.scale}px;
    background:white;
    position:relative;
    box-shadow:0 2px 8px rgba(0,0,0,0.15);
    font-family:Arial,sans-serif;
  }
  .page-content{
    padding:${topMargin * opts.scale}px ${rightMargin * opts.scale}px ${bottomMargin * opts.scale}px ${leftMargin * opts.scale}px;
    position:relative;
    min-height:${contentHeight * opts.scale}px;
  }
  .page-number{
    position:absolute;bottom:8px;right:16px;font-size:11px;color:#999;
  }
</style></head>
<body>
<div class="jasper-report">
  <div class="page-content">${bandsHtml}</div>
  <div class="page-number">${page + 1} / ${totalPages}</div>
</div>
</body></html>`;

    pages.push(pageHtml);
  }

  // Add data table preview page if bands have table columns or detail text fields
  const fields = extractFieldsFromBands(bands);
  if (fields.length > 0) {
    pages.unshift(renderDetailTablePage(fields, opts.scale, reportProperties));
  }

  return { pages, totalPages: pages.length };
}

// --- Data Table Preview ---

function extractFieldsFromDetailBand(detailBand: Band | undefined): Array<{ name: string; label: string }> {
  if (!detailBand?.elements) return [];
  const fields: Array<{ name: string; label: string }> = [];
  const seen = new Set<string>();
  for (const el of detailBand.elements) {
    if (el.type === 'textField' && (el as TextFieldElement).expression) {
      const expr = (el as TextFieldElement).expression!;
      const match = expr.match(/\$F\{(\w+)\}/);
      if (match && !seen.has(match[1])) {
        seen.add(match[1]);
        fields.push({ name: match[1], label: match[1] });
      }
    }
  }
  return fields;
}

function extractFieldsFromBands(bands: Band[]): Array<{ name: string; label: string }> {
  const fields: Array<{ name: string; label: string }> = [];
  const seen = new Set<string>();

  // 1. Extract from Table elements (column detailCell expressions)
  for (const band of bands) {
    if (!band.elements) continue;
    for (const el of band.elements) {
      if (el.type === 'table' && (el as TableElement).columns) {
        for (const col of (el as TableElement).columns) {
          if (!seen.has(col.name)) {
            seen.add(col.name);
            fields.push({ name: col.name, label: col.name });
          }
        }
      }
    }
  }
  if (fields.length > 0) return fields;

  // 2. Fallback: extract from detail band text field expressions
  const detailBand = bands.find(b => b.type === 'detail');
  if (detailBand?.elements) {
    for (const el of detailBand.elements) {
      if (el.type === 'textField' && (el as TextFieldElement).expression) {
        const expr = (el as TextFieldElement).expression!;
        const match = expr.match(/\$F\{(\w+)\}/);
        if (match && !seen.has(match[1])) {
          seen.add(match[1]);
          fields.push({ name: match[1], label: match[1] });
        }
      }
    }
  }

  return fields;
}

function generateMockRows(fields: Array<{ name: string }>, count: number): string[][] {
  const rows: string[][] = [];
  const names = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十'];
  const statuses = ['已完成', '进行中', '待处理'];
  for (let i = 0; i < count; i++) {
    const row: string[] = [];
    for (const field of fields) {
      const lower = field.name.toLowerCase();
      if (/^id$|编号|序号/.test(lower)) row.push(String(i + 1));
      else if (/name|姓名|名称|员工|用户|客户/.test(lower)) row.push(names[i % names.length]);
      else if (/phone|电话|手机/.test(lower)) row.push(`138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`);
      else if (/date|日期|时间/.test(lower)) {
        const d = new Date(Date.now() - Math.random() * 86400000 * 365);
        row.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      }
      else if (/amount|金额|价格|费用|工资/.test(lower)) row.push((Math.floor(Math.random() * 99999) + 1).toLocaleString());
      else if (/status|状态/.test(lower)) row.push(statuses[i % statuses.length]);
      else if (/city|城市/.test(lower)) row.push(['北京', '上海', '广州', '深圳', '杭州'][i % 5]);
      else if (/sex|gender|性别/.test(lower)) row.push(i % 2 === 0 ? '男' : '女');
      else if (/age|年龄/.test(lower)) row.push(String(20 + Math.floor(Math.random() * 40)));
      else row.push(`数据${i + 1}`);
    }
    rows.push(row);
  }
  return rows;
}

function renderDetailTablePage(
  fields: Array<{ name: string; label: string }>,
  scale: number,
  reportProperties: ReportProperties,
): string {
  const mockRows = generateMockRows(fields, 8);
  const pw = reportProperties.pageWidth;
  const ph = reportProperties.pageHeight;

  let headerCells = '';
  let bodyRows = '';
  for (const f of fields) {
    headerCells += `<th style="padding:8px 12px;background:#f0f5ff;border:1px solid #d0d7de;font-weight:600;font-size:13px;text-align:left;white-space:nowrap;">${escapeHtml(f.label)}</th>`;
  }
  for (const row of mockRows) {
    let cells = '';
    for (const val of row) {
      cells += `<td style="padding:6px 12px;border:1px solid #d0d7de;font-size:13px;white-space:nowrap;">${escapeHtml(String(val))}</td>`;
    }
    bodyRows += `<tr>${cells}</tr>`;
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body{margin:0;padding:0;background:#f0f0f0;display:flex;justify-content:center;}
  .jasper-report{
    width:${pw * scale}px;
    min-height:${ph * scale}px;
    background:white;
    position:relative;
    box-shadow:0 2px 8px rgba(0,0,0,0.15);
    font-family:Arial,sans-serif;
  }
  .page-content{
    padding:${20 * scale}px;
    position:relative;
    min-height:${ph * scale - 40 * scale}px;
  }
</style></head>
<body>
<div class="jasper-report">
  <div class="page-content">
    <div style="margin-bottom:12px;font-size:${14 * scale}px;font-weight:600;color:#333;">数据预览</div>
    <div style="overflow-x:auto;">
      <table style="border-collapse:collapse;width:100%;">
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
  </div>
</div>
</body></html>`;
}
