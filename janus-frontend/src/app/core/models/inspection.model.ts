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

export type ExpenseCategory = string;
export type ChargeType = 'INCOME' | 'EXPENSE';
export type PaymentType = 'COLLECT' | 'PREPAID';
export type BillToType = 'COMPANY' | 'CONSIGNEE' | 'INDIVIDUAL';

export type BillingStatus = 'NONE' | 'SENT_TO_BILLING' | 'INVOICED';

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
  responsable: string | null;
  justification: string | null;
  reimbursable: boolean;
  paymentStatus: string;
  createdAt: string;
  chargeType: ChargeType;
  quantity: number;
  units: string | null;
  rate: number | null;
  paymentType: PaymentType | null;
  billToType: BillToType | null;
  billToName: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  referenceNumberCharge: string | null;
  showOnDocuments: boolean;
  updateRelated: boolean;
  notes: string | null;
  billingStatus: BillingStatus;
  billFlowInvoiceId: number | null;
  ncfNumber: string | null;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  reimbursable: boolean;
  descriptions: string[];
}

export interface ChargeCrossReference {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  incomeByCategory: CategoryBreakdown[];
  expenseByCategory: CategoryBreakdown[];
  reimbursableSentToBillingCount: number;
  totalReimbursableCount: number;
  allReimbursableSentToBilling: boolean;
}

export interface ExpenseSummary {
  expenses: InspectionExpense[];
  total: number;
  incomeTotal: number;
  expenseTotal: number;
}

export interface InvoiceSummary {
  invoiceCode: string;
  ncfNumber: string;
  totalAmount: number;
  lineCount: number;
}

export interface SendToBillingResult {
  updatedCount: number;
  invoices: InvoiceSummary[];
}

export interface CreateExpenseRequest {
  category: ExpenseCategory;
  description?: string;
  amount: number;
  currency?: string;
  expenseDate?: string;
  responsable?: string;
  justification?: string;
  reimbursable?: boolean;
  paymentStatus?: string;
  chargeType?: ChargeType;
  quantity?: number;
  units?: string;
  rate?: number;
  paymentType?: PaymentType;
  billToType?: BillToType;
  billToName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  referenceNumber?: string;
  showOnDocuments?: boolean;
  updateRelated?: boolean;
  notes?: string;
}
