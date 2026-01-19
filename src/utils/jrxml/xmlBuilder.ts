import type { ReportProperties } from './types';

export function buildJasperReportOpenTag(properties: ReportProperties): string {
  const safeProperties = {
    ...properties,
    leftMargin: properties.leftMargin || 0,
    rightMargin: properties.rightMargin || 0,
    topMargin: properties.topMargin || 0,
    bottomMargin: properties.bottomMargin || 0
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" 
    name="${safeProperties.name}"
    pageWidth="${safeProperties.pageWidth}"
    pageHeight="${safeProperties.pageHeight}"
    columnWidth="${safeProperties.pageWidth - safeProperties.leftMargin - safeProperties.rightMargin}"
    leftMargin="${safeProperties.leftMargin}"
    rightMargin="${safeProperties.rightMargin}"
    topMargin="${safeProperties.topMargin}"
    bottomMargin="${safeProperties.bottomMargin}">
`;
}

