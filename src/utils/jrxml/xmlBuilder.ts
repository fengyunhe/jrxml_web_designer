import type { ReportProperties } from './types';

export function buildJasperReportOpenTag(properties: ReportProperties): string {
  const safeProperties = {
    ...properties,
    leftMargin: properties.leftMargin || 0,
    rightMargin: properties.rightMargin || 0,
    topMargin: properties.topMargin || 0,
    bottomMargin: properties.bottomMargin || 0
  };

  let attrs = `    name="${safeProperties.name}"
    pageWidth="${safeProperties.pageWidth}"
    pageHeight="${safeProperties.pageHeight}"
    columnWidth="${safeProperties.pageWidth - safeProperties.leftMargin - safeProperties.rightMargin}"
    leftMargin="${safeProperties.leftMargin}"
    rightMargin="${safeProperties.rightMargin}"
    topMargin="${safeProperties.topMargin}"
    bottomMargin="${safeProperties.bottomMargin}"`;

  // 添加可选属性（如果不是默认值）
  if (safeProperties.language && safeProperties.language !== "java") {
    attrs += `\n    language="${safeProperties.language}"`;
  }
  if (safeProperties.columnCount && safeProperties.columnCount !== 1) {
    attrs += `\n    columnCount="${safeProperties.columnCount}"`;
  }
  if (safeProperties.printOrder && safeProperties.printOrder !== "Vertical") {
    attrs += `\n    printOrder="${safeProperties.printOrder}"`;
  }
  if (safeProperties.columnDirection && safeProperties.columnDirection !== "LTR") {
    attrs += `\n    columnDirection="${safeProperties.columnDirection}"`;
  }
  if (safeProperties.orientation && safeProperties.orientation !== "Portrait") {
    attrs += `\n    orientation="${safeProperties.orientation}"`;
  }
  if (safeProperties.whenNoDataType && safeProperties.whenNoDataType !== "AllSectionsNoDetail") {
    attrs += `\n    whenNoDataType="${safeProperties.whenNoDataType}"`;
  }
  if (safeProperties.sectionType && safeProperties.sectionType !== "Band") {
    attrs += `\n    sectionType="${safeProperties.sectionType}"`;
  }
  if (safeProperties.columnWidth && safeProperties.columnWidth !== 555) {
    attrs += `\n    columnWidth="${safeProperties.columnWidth}"`;
  }
  if (safeProperties.columnSpacing && safeProperties.columnSpacing !== 0) {
    attrs += `\n    columnSpacing="${safeProperties.columnSpacing}"`;
  }
  if (safeProperties.isTitleNewPage) {
    attrs += `\n    isTitleNewPage="true"`;
  }
  if (safeProperties.isSummaryNewPage) {
    attrs += `\n    isSummaryNewPage="true"`;
  }
  if (safeProperties.isSummaryWithPageHeaderAndFooter) {
    attrs += `\n    isSummaryWithPageHeaderAndFooter="true"`;
  }
  if (safeProperties.isFloatColumnFooter) {
    attrs += `\n    isFloatColumnFooter="true"`;
  }
  if (safeProperties.isIgnorePagination) {
    attrs += `\n    isIgnorePagination="true"`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
${attrs}>
`;
}

