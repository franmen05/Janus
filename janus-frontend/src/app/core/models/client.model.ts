export interface Client {
  id: number;
  name: string;
  taxId: string;
  email: string;
  phone: string | null;
  address: string | null;
  active: boolean;
  createdAt: string;
}

export interface CreateClientRequest {
  name: string;
  taxId: string;
  email: string;
  phone?: string;
  address?: string;
}
