export type LiquidationStatus = 'PRELIMINARY' | 'APPROVED' | 'DEFINITIVE' | 'PAID';

export type PaymentMethod = 'BANK_TRANSFER' | 'CHECK' | 'CASH' | 'ELECTRONIC';

export interface LiquidationLine {
  id: number;
  concept: string;
  description: string | null;
  baseAmount: number | null;
  rate: number | null;
  amount: number;
  lineOrder: number;
  reimbursable: boolean;
  chargeType: string;
}

export interface Liquidation {
  id: number;
  operationId: number;
  declarationId: number;
  status: LiquidationStatus;
  totalCustomsTaxes: number;
  totalThirdParty: number;
  totalAgencyServices: number;
  grandTotal: number;
  dgaPaymentCode: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  approvalComment: string | null;
  lines: LiquidationLine[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: number;
  operationId: number;
  liquidationId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  dgaReference: string | null;
  bankReference: string | null;
  notes: string | null;
  registeredBy: string;
  createdAt: string;
}

export interface RegisterPaymentRequest {
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  dgaReference?: string;
  bankReference?: string;
  notes?: string;
}
