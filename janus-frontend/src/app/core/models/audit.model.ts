export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  UPLOAD = 'UPLOAD',
  DOWNLOAD = 'DOWNLOAD',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT'
}

export interface AuditLog {
  id: number;
  username: string;
  ipAddress: string | null;
  action: AuditAction;
  entityName: string;
  entityId: number | null;
  operationId: number | null;
  details: string | null;
  createdAt: string;
}
