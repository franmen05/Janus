export interface Comment {
  id: number;
  operationId: number;
  authorUsername: string;
  authorFullName: string;
  content: string;
  internal: boolean;
  createdAt: string;
}

export interface CreateCommentRequest {
  content: string;
  internal: boolean;
}
