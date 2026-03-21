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

