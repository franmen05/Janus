export interface ComplianceRuleConfig {
  id: number;
  ruleCode: string;
  paramKey: string;
  paramValue: string;
  enabled: boolean;
  description: string | null;
}
