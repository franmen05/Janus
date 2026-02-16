export interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  ruleCode: string;
  message: string;
}
