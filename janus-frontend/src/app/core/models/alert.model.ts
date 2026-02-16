export enum AlertType {
  INACTIVITY_48H = 'INACTIVITY_48H',
  DEADLINE_APPROACHING = 'DEADLINE_APPROACHING'
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
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
}
