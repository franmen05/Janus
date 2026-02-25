export enum ExternalPermitType {
  VUCE = 'VUCE',
  FDA = 'FDA',
  DPH = 'DPH',
  PORTCOLLECT = 'PORTCOLLECT',
  DPW = 'DPW'
}

export enum ExternalPermitStatus {
  PENDIENTE = 'PENDIENTE',
  EN_TRAMITE = 'EN_TRAMITE',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO'
}

export interface ExternalPermit {
  id: number;
  operationId: number;
  permitType: ExternalPermitType;
  status: ExternalPermitStatus;
  referenceNumber: string | null;
  issuedDate: string | null;
  expiryDate: string | null;
  notes: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalPermitRequest {
  permitType: ExternalPermitType;
  status?: ExternalPermitStatus;
  referenceNumber?: string;
  issuedDate?: string;
  expiryDate?: string;
  notes?: string;
}

export interface ValuationChecklist {
  items: ChecklistItem[];
  allPassed: boolean;
}

export interface ChecklistItem {
  code: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface GattFormResponse {
  declarationId: number | null;
  gattMethod: string | null;
  commercialLinks: boolean | null;
  commissions: number | null;
  unrecordedTransport: number | null;
  adjustmentAmount: number | null;
  justification: string | null;
  originalTaxableBase: number | null;
  adjustedTaxableBase: number | null;
  completedAt: string | null;
  completedBy: string | null;
  required: boolean;
}

export interface UpdateGattFormRequest {
  commercialLinks: boolean;
  commissions: number;
  unrecordedTransport: number;
  adjustmentAmount: number;
  justification: string;
}
