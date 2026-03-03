export enum ClientType {
  COMPANY = 'COMPANY',
  CONSIGNEE = 'CONSIGNEE',
  INDIVIDUAL = 'INDIVIDUAL'
}

export interface Client {
  id: number;
  name: string;
  taxId: string;
  email: string;
  phone: string | null;
  address: string | null;
  clientType: ClientType;
  active: boolean;
  createdAt: string;
}

export interface CreateClientRequest {
  name: string;
  taxId: string;
  email: string;
  clientType: ClientType;
  phone?: string;
  address?: string;
}
