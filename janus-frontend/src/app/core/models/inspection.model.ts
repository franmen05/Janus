import { InspectionType } from './operation.model';

export interface InspectionPhoto {
  id: number;
  operationId: number;
  uploadedBy: string;
  originalName: string;
  storedName: string;
  fileSize: number;
  mimeType: string;
  caption: string | null;
  active: boolean;
  createdAt: string;
}

export interface SetInspectionTypeRequest {
  inspectionType: InspectionType;
  comment?: string;
}

export type ExpenseCategory = 'LABOR' | 'EQUIPMENT' | 'TRANSPORT' | 'SECURITY' | 'OVERTIME' | 'OTHER';

export interface InspectionExpense {
  id: number;
  operationId: number;
  registeredByUsername: string;
  registeredByFullName: string;
  category: ExpenseCategory;
  description: string | null;
  amount: number;
  currency: string;
  expenseDate: string;
  justification: string | null;
  createdAt: string;
}

export interface ExpenseSummary {
  expenses: InspectionExpense[];
  total: number;
}

export interface CreateExpenseRequest {
  category: ExpenseCategory;
  description?: string;
  amount: number;
  currency?: string;
  expenseDate?: string;
  justification?: string;
}
