export enum OperationStatus {
  DRAFT = 'DRAFT',
  DOCUMENTATION_COMPLETE = 'DOCUMENTATION_COMPLETE',
  IN_REVIEW = 'IN_REVIEW',
  PENDING_CORRECTION = 'PENDING_CORRECTION',
  PRELIQUIDATION_REVIEW = 'PRELIQUIDATION_REVIEW',
  ANALYST_ASSIGNED = 'ANALYST_ASSIGNED',
  DECLARATION_IN_PROGRESS = 'DECLARATION_IN_PROGRESS',
  SUBMITTED_TO_CUSTOMS = 'SUBMITTED_TO_CUSTOMS',
  VALUATION_REVIEW = 'VALUATION_REVIEW',
  PAYMENT_PREPARATION = 'PAYMENT_PREPARATION',
  IN_TRANSIT = 'IN_TRANSIT',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED'
}

export enum TransportMode {
  MARITIME = 'MARITIME',
  AIR = 'AIR'
}

export enum CargoType {
  FCL = 'FCL',
  LCL = 'LCL'
}

export enum OperationCategory {
  CATEGORY_1 = 'CATEGORY_1',
  CATEGORY_2 = 'CATEGORY_2',
  CATEGORY_3 = 'CATEGORY_3'
}

export enum InspectionType {
  EXPRESO = 'EXPRESO',
  VISUAL = 'VISUAL',
  FISICA = 'FISICA'
}

export enum BlType {
  SIMPLE = 'SIMPLE',
  CONSOLIDATED = 'CONSOLIDATED'
}

export interface Operation {
  id: number;
  referenceNumber: string;
  clientId: number;
  clientName: string;
  transportMode: TransportMode;
  cargoType?: CargoType | null;
  operationCategory: OperationCategory;
  status: OperationStatus;
  assignedAgentId: number | null;
  assignedAgentName: string | null;
  blNumber: string | null;
  blType?: BlType | null;
  childBlNumber?: string | null;
  containerNumber: string | null;
  estimatedArrival: string | null;
  blOriginalAvailable: boolean;
  notes: string | null;
  deadline: string | null;
  closedAt: string | null;
  inspectionType?: InspectionType | null;
  inspectionSetAt?: string | null;
  incoterm?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOperationRequest {
  clientId: number;
  transportMode: TransportMode;
  cargoType?: CargoType;
  operationCategory: OperationCategory;
  assignedAgentId?: number;
  blNumber?: string;
  blType?: BlType;
  childBlNumber?: string;
  containerNumber?: string;
  estimatedArrival?: string;
  blOriginalAvailable?: boolean;
  notes?: string;
  deadline?: string;
  incoterm?: string;
}

export interface ChangeStatusRequest {
  newStatus: OperationStatus;
  comment?: string;
}

export interface StatusHistory {
  id: number;
  previousStatus: OperationStatus | null;
  newStatus: OperationStatus;
  changedByUsername: string;
  comment: string | null;
  changedAt: string;
  ipAddress: string | null;
}
