export enum TimelineEventType {
  STATUS_CHANGE = 'STATUS_CHANGE',
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  DOCUMENT_VERSION = 'DOCUMENT_VERSION',
  COMMENT = 'COMMENT',
  APPROVAL = 'APPROVAL',
  REJECTION = 'REJECTION',
  ALERT = 'ALERT'
}

export interface TimelineEventResponse {
  eventType: TimelineEventType;
  description: string;
  username: string;
  timestamp: string;
  previousStatus: string | null;
  newStatus: string | null;
  metadata: Record<string, unknown>;
}
