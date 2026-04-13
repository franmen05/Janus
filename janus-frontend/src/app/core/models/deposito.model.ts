export interface Deposito {
  id: number;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface CreateDepositoRequest {
  code: string;
  name: string;
  description?: string;
}
