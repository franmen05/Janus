export interface ExpenseCategoryConfig {
  id: number;
  name: string;
  labelEs: string;
  labelEn: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CreateExpenseCategoryRequest {
  name: string;
  labelEs: string;
  labelEn: string;
}

export interface UpdateExpenseCategoryRequest {
  labelEs: string;
  labelEn: string;
  sortOrder: number;
}
