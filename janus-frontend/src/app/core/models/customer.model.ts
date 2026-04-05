export enum CustomerType {
  COMPANY = 'COMPANY',
  CONSIGNEE = 'CONSIGNEE',
  INDIVIDUAL = 'INDIVIDUAL'
}

export type DocumentType = 'RNC' | 'CEDULA' | 'PASSPORT';

export interface Customer {
  id: number;
  name: string;
  taxId: string;
  email: string;
  phone: string | null;
  address: string | null;
  customerType: CustomerType;
  active: boolean;
  createdAt: string;
  businessName: string | null;
  representative: string | null;
  documentType: DocumentType | null;
  alternatePhone: string | null;
  country: string | null;
}

export interface CreateCustomerRequest {
  name: string;
  taxId: string;
  email: string;
  customerType: CustomerType;
  phone?: string;
  address?: string;
  businessName?: string;
  representative?: string;
  documentType?: DocumentType;
  alternatePhone?: string;
  country?: string;
}
