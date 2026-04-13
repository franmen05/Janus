export enum CustomerType {
  COMPANY = 'COMPANY',
  CONSIGNEE = 'CONSIGNEE',
  INDIVIDUAL = 'INDIVIDUAL',
  SHIPPER = 'SHIPPER',
  CARRIER = 'CARRIER'
}

export type DocumentType = 'RNC' | 'CEDULA' | 'PASSPORT';

export interface Customer {
  id: number;
  name: string;
  taxId: string;
  email: string;
  phone: string | null;
  address: string | null;
  customerTypes: CustomerType[];
  active: boolean;
  createdAt: string;
  businessName: string | null;
  representative: string | null;
  documentType: DocumentType | null;
  alternatePhone: string | null;
  country: string | null;
  customerCode: string | null;
  notes: string | null;
  contacts: CustomerContact[];
}

export enum ContactType {
  PRIMARY = 'PRIMARY',
  ALTERNATE = 'ALTERNATE'
}

export interface CustomerContact {
  id: number;
  firstName: string;
  lastName: string;
  identification: string;
  phone: string;
  email: string | null;
  contactType: ContactType;
  receiveNotifications: boolean;
  createdAt: string;
}

export interface CreateCustomerContactRequest {
  firstName: string;
  lastName: string;
  identification: string;
  phone: string;
  email?: string;
  contactType: ContactType;
  receiveNotifications: boolean;
}

export interface CreateCustomerRequest {
  name: string;
  taxId: string;
  email: string;
  customerTypes: CustomerType[];
  phone?: string;
  address?: string;
  businessName?: string;
  representative?: string;
  documentType?: DocumentType;
  alternatePhone?: string;
  country?: string;
  customerCode?: string;
  notes?: string;
}
