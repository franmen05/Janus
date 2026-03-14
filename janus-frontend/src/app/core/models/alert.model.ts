export enum AlertType {
  INACTIVITY_48H = 'INACTIVITY_48H',
  DEADLINE_APPROACHING = 'DEADLINE_APPROACHING',
  MISSING_CRITICAL_DOCUMENT = 'MISSING_CRITICAL_DOCUMENT',
  BL_UNAVAILABLE = 'BL_UNAVAILABLE',
  DECLARATION_DEADLINE = 'DECLARATION_DEADLINE'
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED'
}

export interface Alert {
  id: number;
  operationId: number;
  operationRef: string;
  alertType: AlertType;
  status: AlertStatus;
  message: string;
  messageParams: string | null;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
}
