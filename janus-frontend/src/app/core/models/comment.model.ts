export interface Comment {
  id: number;
  operationId: number;
  authorUsername: string;
  authorFullName: string;
  content: string;
  createdAt: string;
}

export interface CreateCommentRequest {
  content: string;
}
