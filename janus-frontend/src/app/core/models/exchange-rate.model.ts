export interface ExchangeRate {
  id: number;
  sourceCurrency: string;
  targetCurrency: string;
  rate: number;
  effectiveDate: string;
  source: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExchangeRateRequest {
  rate: number;
  effectiveDate: string;
}

export interface AutoFetchStatus {
  enabled: boolean;
  hour: number;
  minute: number;
}
