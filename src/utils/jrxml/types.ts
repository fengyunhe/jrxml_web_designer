export interface ReportProperties {
  name: string;
  pageWidth: number;
  pageHeight: number;
  leftMargin: number;
  rightMargin: number;
  topMargin: number;
  bottomMargin: number;
  whenNoDataType?: string;
  query?: { language: string; text: string };
}

export interface Field {
  name: string;
  class: string;
  properties?: Record<string, string>;
}

export interface Parameter {
  name: string;
  class: string;
  defaultValue?: string;
}

export interface SubDataset {
  name: string;
  fields: Field[];
  parameters: Parameter[];
  properties?: Record<string, string>;
  query?: { language: string; text: string };
}


