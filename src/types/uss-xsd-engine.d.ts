declare module 'uss-xsd-engine' {
  interface Location {
    line: number;
    column: number;
  }

  interface Issue {
    level?: 'error' | 'warning' | 'info';
    severity?: 'error' | 'warning' | 'info';
    message: string;
    code?: string;
    line?: number;
    column?: number;
    location?: Location;
    path?: string[];
    source?: string;
    nodeKind?: string;
    name?: string;
    details?: Record<string, unknown>;
  }

  interface ValidateXmlResult {
    ok: boolean;
    issues: Issue[];
    summary: {
      errorCount: number;
      warningCount: number;
      infoCount: number;
    };
    data?: unknown;
  }

  interface ValidateXmlOptions {
    xsdText: string;
    xmlText: string;
    rootElementName?: string;
    externalDocuments?: Record<string, string>;
  }

  interface SchemaDiagnosticsResult {
    ok: boolean;
    issues: Issue[];
    summary: {
      errorCount: number;
      warningCount: number;
      infoCount: number;
    };
    data?: {
      roots?: string[];
      supportedFeatures?: string[];
      unsupportedFeatures?: string[];
      statistics?: Record<string, number>;
    };
  }

  interface SchemaDiagnosticsOptions {
    xsdText: string;
    options?: {
      includeWarnings?: boolean;
      includeFeatureSummary?: boolean;
      includeRoots?: boolean;
    };
  }

  function validateXml(options: ValidateXmlOptions): Promise<ValidateXmlResult>;
  function getSchemaDiagnostics(options: SchemaDiagnosticsOptions): Promise<SchemaDiagnosticsResult>;

  export { 
    validateXml, 
    getSchemaDiagnostics, 
    ValidateXmlResult, 
    SchemaDiagnosticsResult,
    Issue, 
    Location 
  };
}