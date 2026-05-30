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

export interface Variable {
  name: string;
  class: string;
  calculationType?: string;
  resetType?: string;
  resetGroup?: string;
  expression?: string;
  initialValueExpression?: string;
}

export interface ReportStyle {
  name: string;
  parentStyle?: string;
  mode?: string;
  backcolor?: string;
  forecolor?: string;
  conditionExpression?: string;
  box?: any;
  textAlignment?: string;
  verticalAlignment?: string;
  fontFamily?: string;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  conditionalStyles?: ConditionalStyle[];
}

export interface ConditionalStyle {
  conditionExpression: string;
  properties: Partial<ReportStyle>;
}


