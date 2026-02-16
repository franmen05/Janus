export interface DashboardMetrics {
  operationsByStatus: Record<string, number>;
  overdueCount: number;
  averageTimePerStage: Record<string, number>;
  rejectionRate: number;
  productivityByAgent: AgentProductivity[];
}

export interface AgentProductivity {
  agentUsername: string;
  agentFullName: string;
  operationsHandled: number;
  operationsClosed: number;
}

export interface DashboardFilter {
  from?: string;
  to?: string;
  cargoType?: string;
  inspectionType?: string;
  agentUsername?: string;
}
