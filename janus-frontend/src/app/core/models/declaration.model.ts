export enum DeclarationType {
  PRELIMINARY = 'PRELIMINARY',
  FINAL = 'FINAL'
}

export enum CrossingStatus {
  PENDING = 'PENDING',
  MATCH = 'MATCH',
  DISCREPANCY = 'DISCREPANCY',
  RESOLVED = 'RESOLVED'
}

export enum DiscrepancyField {
  TAXABLE_BASE = 'TAXABLE_BASE',
  TOTAL_TAXES = 'TOTAL_TAXES',
  FOB_VALUE = 'FOB_VALUE',
  CIF_VALUE = 'CIF_VALUE',
  FREIGHT_VALUE = 'FREIGHT_VALUE',
  INSURANCE_VALUE = 'INSURANCE_VALUE',
  TARIFF_LINE_MISSING = 'TARIFF_LINE_MISSING',
  TARIFF_LINE_QUANTITY = 'TARIFF_LINE_QUANTITY',
  TARIFF_LINE_VALUE = 'TARIFF_LINE_VALUE',
  TARIFF_LINE_TAX = 'TARIFF_LINE_TAX'
}

export interface Declaration {
  id: number;
  operationId: number;
  declarationType: DeclarationType;
  declarationNumber: string;
  fobValue: number;
  cifValue: number;
  taxableBase: number;
  totalTaxes: number;
  freightValue: number;
  insuranceValue: number;
  gattMethod: string;
  notes: string | null;
  submittedAt: string | null;
  createdAt: string;
}

export interface CreateDeclarationRequest {
  declarationNumber: string;
  fobValue: number;
  cifValue: number;
  taxableBase: number;
  totalTaxes: number;
  freightValue: number;
  insuranceValue: number;
  gattMethod: string;
  notes?: string;
}

export interface TariffLine {
  id: number;
  declarationId: number;
  lineNumber: number;
  tariffCode: string;
  description: string | null;
  quantity: number;
  unitValue: number;
  totalValue: number;
  taxRate: number;
  taxAmount: number;
}

export interface CreateTariffLineRequest {
  lineNumber: number;
  tariffCode: string;
  description?: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  taxRate: number;
  taxAmount: number;
}

export interface CrossingResult {
  id: number;
  operationId: number;
  preliminaryDeclarationId: number;
  finalDeclarationId: number;
  status: CrossingStatus;
  resolvedBy: string | null;
  resolutionComment: string | null;
  resolvedAt: string | null;
  discrepancies: CrossingDiscrepancy[];
  createdAt: string;
}

export interface CrossingDiscrepancy {
  id: number;
  field: DiscrepancyField;
  tariffLineNumber: number | null;
  preliminaryValue: string;
  finalValue: string;
  difference: number;
  description: string;
}

export interface ResolveCrossingRequest {
  comment: string;
}
