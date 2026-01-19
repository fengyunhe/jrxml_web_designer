export interface ReportProperties {
  name: string;
  pageWidth: number;
  pageHeight: number;
  leftMargin: number;
  rightMargin: number;
  topMargin: number;
  bottomMargin: number;
}

export interface Field {
  name: string;
  class: string;
}

export interface Parameter {
  name: string;
  class: string;
  defaultValue?: string;
}

