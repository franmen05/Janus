export enum OperationStatus {
  DRAFT = 'DRAFT',
  DOCUMENTATION_COMPLETE = 'DOCUMENTATION_COMPLETE',
  DECLARATION_IN_PROGRESS = 'DECLARATION_IN_PROGRESS',
  SUBMITTED_TO_CUSTOMS = 'SUBMITTED_TO_CUSTOMS',
  VALUATION_REVIEW = 'VALUATION_REVIEW',
  PAYMENT_PREPARATION = 'PAYMENT_PREPARATION',
  IN_TRANSIT = 'IN_TRANSIT',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED'
}

export enum CargoType {
  FCL = 'FCL',
  LCL = 'LCL'
}

export enum InspectionType {
  EXPRESS = 'EXPRESS',
  VISUAL = 'VISUAL',
  PHYSICAL = 'PHYSICAL'
}

export interface Operation {
  id: number;
  referenceNumber: string;
  clientId: number;
  clientName: string;
  cargoType: CargoType;
  inspectionType: InspectionType;
  status: OperationStatus;
  assignedAgentId: number | null;
  assignedAgentName: string | null;
  originCountry: string | null;
  notes: string | null;
  deadline: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOperationRequest {
  clientId: number;
  cargoType: CargoType;
  inspectionType: InspectionType;
  assignedAgentId?: number;
  originCountry?: string;
  notes?: string;
  deadline?: string;
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
