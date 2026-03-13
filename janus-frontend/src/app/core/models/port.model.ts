export interface Port {
  id: number;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface CreatePortRequest {
  code: string;
  name: string;
  description?: string;
}
