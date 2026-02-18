export enum DocumentType {
  BL = 'BL',
  COMMERCIAL_INVOICE = 'COMMERCIAL_INVOICE',
  PACKING_LIST = 'PACKING_LIST',
  CERTIFICATE = 'CERTIFICATE',
  OTHER = 'OTHER'
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  VALIDATED = 'VALIDATED',
  OBSERVED = 'OBSERVED',
  REQUIRES_REPLACEMENT = 'REQUIRES_REPLACEMENT'
}

export interface Document {
  id: number;
  operationId: number;
  documentType: DocumentType;
  status: DocumentStatus;
  active: boolean;
  latestVersionName?: string;
  latestVersionSize?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: number;
  versionNumber: number;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedByUsername: string;
  changeReason?: string;
  uploadedAt: string;
}

export interface CompletenessResponse {
  percentage: number;
  missingDocuments: DocumentType[];
  color: string;
}
