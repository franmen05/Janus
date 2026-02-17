import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { OperationService } from '../../core/services/operation.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { AlertService } from '../../core/services/alert.service';
import { AuthService } from '../../core/services/auth.service';
import { Operation, OperationStatus, CargoType, InspectionType } from '../../core/models/operation.model';
import { DashboardMetrics, DashboardFilter } from '../../core/models/dashboard.model';
import { Alert } from '../../core/models/alert.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { StatusLabelPipe } from '../../shared/pipes/status-label.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, StatusBadgeComponent, StatusLabelPipe],
  template: `
    <h2 class="mb-4">{{ 'DASHBOARD.TITLE' | translate }}</h2>

    @if (authService.hasRole(['ADMIN', 'AGENT', 'ACCOUNTING'])) {
      <!-- Filter bar -->
      <div class="card mb-3">
        <div class="card-body py-2">
          <div class="row g-2 align-items-end">
            <div class="col-6 col-md-2">
              <label class="form-label form-label-sm mb-0">{{ 'DASHBOARD.FILTER_FROM' | translate }}</label>
              <input type="date" class="form-control form-control-sm" [(ngModel)]="filterFrom">
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label form-label-sm mb-0">{{ 'DASHBOARD.FILTER_TO' | translate }}</label>
              <input type="date" class="form-control form-control-sm" [(ngModel)]="filterTo">
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label form-label-sm mb-0">{{ 'DASHBOARD.FILTER_CARGO' | translate }}</label>
              <select class="form-select form-select-sm" [(ngModel)]="filterCargo">
                <option value="">{{ 'DASHBOARD.FILTER_ALL' | translate }}</option>
                @for (t of cargoTypes; track t) { <option [value]="t">{{ t | statusLabel }}</option> }
              </select>
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label form-label-sm mb-0">{{ 'DASHBOARD.FILTER_INSPECTION' | translate }}</label>
              <select class="form-select form-select-sm" [(ngModel)]="filterInspection">
                <option value="">{{ 'DASHBOARD.FILTER_ALL' | translate }}</option>
                @for (t of inspectionTypes; track t) { <option [value]="t">{{ t | statusLabel }}</option> }
              </select>
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label form-label-sm mb-0">{{ 'DASHBOARD.FILTER_AGENT' | translate }}</label>
              <input type="text" class="form-control form-control-sm" [(ngModel)]="filterAgent">
            </div>
            <div class="col-6 col-md-2">
              <button class="btn btn-sm btn-primary w-100" (click)="applyFilters()">{{ 'DASHBOARD.FILTER_APPLY' | translate }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- KPI cards -->
      <div class="row mb-4">
        <div class="col-6 col-md-3">
          <div class="card card-dashboard border-primary">
            <div class="card-body">
              <h5 class="card-title text-primary">{{ 'DASHBOARD.ACTIVE' | translate }}</h5>
              <h2 class="mb-0">{{ activeCount() }}</h2>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card card-dashboard border-danger">
            <div class="card-body">
              <h5 class="card-title text-danger">{{ 'DASHBOARD.OVERDUE' | translate }}</h5>
              <h2 class="mb-0">{{ metrics()?.overdueCount ?? 0 }}</h2>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card card-dashboard border-warning">
            <div class="card-body">
              <h5 class="card-title text-warning">{{ 'DASHBOARD.REJECTION_RATE' | translate }}</h5>
              <h2 class="mb-0">{{ (metrics()?.rejectionRate ?? 0) | number:'1.1-1' }}%</h2>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card card-dashboard border-success">
            <div class="card-body">
              <h5 class="card-title text-success">{{ 'DASHBOARD.CLOSED' | translate }}</h5>
              <h2 class="mb-0">{{ closedCount() }}</h2>
            </div>
          </div>
        </div>
      </div>

      <div class="row mb-4">
        <!-- Operations by Status -->
        <div class="col-12 col-md-6 mb-3 mb-md-0">
          <div class="card h-100">
            <div class="card-header"><h6 class="mb-0">{{ 'DASHBOARD.OPS_BY_STATUS' | translate }}</h6></div>
            <div class="card-body p-0 table-responsive">
              <table class="table table-sm mb-0">
                <thead class="table-light"><tr><th>{{ 'COMMON.STATUS' | translate }}</th><th>{{ 'DASHBOARD.COUNT' | translate }}</th></tr></thead>
                <tbody>
                  @for (entry of statusEntries(); track entry[0]) {
                    <tr><td><app-status-badge [status]="entry[0]" /></td><td>{{ entry[1] }}</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <!-- Average Time per Stage -->
        <div class="col-12 col-md-6">
          <div class="card h-100">
            <div class="card-header"><h6 class="mb-0">{{ 'DASHBOARD.AVG_TIME_STAGE' | translate }}</h6></div>
            <div class="card-body p-0 table-responsive">
              <table class="table table-sm mb-0">
                <thead class="table-light"><tr><th>{{ 'DASHBOARD.STAGE' | translate }}</th><th>{{ 'DASHBOARD.HOURS' | translate }}</th></tr></thead>
                <tbody>
                  @for (entry of stageEntries(); track entry[0]) {
                    <tr><td>{{ entry[0] | statusLabel }}</td><td>{{ entry[1] | number:'1.1-1' }}</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Agent Productivity -->
      @if (metrics()?.productivityByAgent?.length) {
        <div class="card mb-4">
          <div class="card-header"><h6 class="mb-0">{{ 'DASHBOARD.AGENT_PRODUCTIVITY' | translate }}</h6></div>
          <div class="card-body p-0 table-responsive">
            <table class="table table-sm mb-0">
              <thead class="table-light">
                <tr>
                  <th>{{ 'DASHBOARD.AGENT_NAME' | translate }}</th>
                  <th>{{ 'DASHBOARD.OPS_HANDLED' | translate }}</th>
                  <th>{{ 'DASHBOARD.OPS_CLOSED' | translate }}</th>
                  <th>{{ 'DASHBOARD.CLOSE_RATE' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (agent of metrics()!.productivityByAgent; track agent.agentUsername) {
                  <tr>
                    <td>{{ agent.agentFullName }}</td>
                    <td>{{ agent.operationsHandled }}</td>
                    <td>{{ agent.operationsClosed }}</td>
                    <td>{{ agent.operationsHandled > 0 ? (agent.operationsClosed / agent.operationsHandled * 100 | number:'1.0-0') : 0 }}%</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Active Alerts -->
      @if (activeAlerts().length > 0) {
        <div class="card mb-4 border-warning">
          <div class="card-header bg-warning bg-opacity-10 d-flex justify-content-between align-items-center">
            <h6 class="mb-0">{{ 'DASHBOARD.ACTIVE_ALERTS' | translate }} ({{ activeAlerts().length }})</h6>
            <a routerLink="/alerts" class="btn btn-sm btn-outline-warning">{{ 'DASHBOARD.VIEW_ALL' | translate }}</a>
          </div>
          <div class="card-body p-0 table-responsive">
            <table class="table table-sm mb-0">
              <thead class="table-light">
                <tr><th>{{ 'ALERTS.OPERATION' | translate }}</th><th>{{ 'ALERTS.TYPE' | translate }}</th><th class="d-none d-md-table-cell">{{ 'ALERTS.MESSAGE' | translate }}</th><th>{{ 'ALERTS.CREATED' | translate }}</th></tr>
              </thead>
              <tbody>
                @for (alert of activeAlerts().slice(0, 5); track alert.id) {
                  <tr>
                    <td><a [routerLink]="['/operations', alert.operationId]">{{ alert.operationRef }}</a></td>
                    <td><span class="badge" [class]="alert.alertType === 'DEADLINE_APPROACHING' ? 'bg-danger' : 'bg-warning text-dark'">{{ alert.alertType | statusLabel }}</span></td>
                    <td class="d-none d-md-table-cell">{{ alert.message }}</td>
                    <td>{{ alert.createdAt | date:'short' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    } @else {
      <!-- Simple view for CLIENT/CARRIER -->
      <div class="row mb-4">
        <div class="col-6 col-md-3">
          <div class="card card-dashboard border-primary">
            <div class="card-body">
              <h5 class="card-title text-primary">{{ 'DASHBOARD.ACTIVE' | translate }}</h5>
              <h2 class="mb-0">{{ activeCount() }}</h2>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card card-dashboard border-success">
            <div class="card-body">
              <h5 class="card-title text-success">{{ 'DASHBOARD.CLOSED' | translate }}</h5>
              <h2 class="mb-0">{{ closedCount() }}</h2>
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">{{ 'DASHBOARD.RECENT_OPERATIONS' | translate }}</h5>
          <a routerLink="/operations" class="btn btn-sm btn-outline-primary">{{ 'DASHBOARD.VIEW_ALL' | translate }}</a>
        </div>
        <div class="card-body p-0 table-responsive">
          <table class="table table-hover mb-0">
            <thead><tr><th>{{ 'OPERATIONS.REFERENCE' | translate }}</th><th>{{ 'OPERATIONS.CLIENT' | translate }}</th><th>{{ 'COMMON.STATUS' | translate }}</th><th class="d-none d-sm-table-cell">{{ 'OPERATIONS.CREATED' | translate }}</th></tr></thead>
            <tbody>
              @for (op of recentOperations(); track op.id) {
                <tr [routerLink]="['/operations', op.id]" style="cursor: pointer;">
                  <td>{{ op.referenceNumber }}</td>
                  <td>{{ op.clientName }}</td>
                  <td><app-status-badge [status]="op.status" /></td>
                  <td class="d-none d-sm-table-cell">{{ op.createdAt | date:'shortDate' }}</td>
                </tr>
              }
              @if (recentOperations().length === 0) {
                <tr><td colspan="4" class="text-center text-muted py-3">{{ 'DASHBOARD.NO_OPERATIONS' | translate }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `
})
export class DashboardComponent implements OnInit {
  private operationService = inject(OperationService);
  private dashboardService = inject(DashboardService);
  private alertService = inject(AlertService);
  authService = inject(AuthService);

  recentOperations = signal<Operation[]>([]);
  metrics = signal<DashboardMetrics | null>(null);
  activeCount = signal(0);
  closedCount = signal(0);
  statusEntries = signal<[string, number][]>([]);
  stageEntries = signal<[string, number][]>([]);
  activeAlerts = signal<Alert[]>([]);

  filterFrom = '';
  filterTo = '';
  filterCargo = '';
  filterInspection = '';
  filterAgent = '';
  cargoTypes = Object.values(CargoType);
  inspectionTypes = Object.values(InspectionType);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.operationService.getAll().subscribe(ops => {
      this.recentOperations.set(ops.slice(0, 10));
      this.activeCount.set(ops.filter(o => o.status !== OperationStatus.CLOSED && o.status !== OperationStatus.CANCELLED && o.status !== OperationStatus.DRAFT).length);
      this.closedCount.set(ops.filter(o => o.status === OperationStatus.CLOSED).length);
    });

    if (this.authService.hasRole(['ADMIN', 'AGENT', 'ACCOUNTING'])) {
      this.loadMetrics();
      this.alertService.getActiveAlerts().subscribe(alerts => this.activeAlerts.set(alerts));
    }
  }

  loadMetrics(): void {
    const filter: DashboardFilter = {};
    if (this.filterFrom) filter.from = this.filterFrom;
    if (this.filterTo) filter.to = this.filterTo;
    if (this.filterCargo) filter.cargoType = this.filterCargo;
    if (this.filterInspection) filter.inspectionType = this.filterInspection;
    if (this.filterAgent) filter.agentUsername = this.filterAgent;

    this.dashboardService.getMetrics(filter).subscribe(m => {
      this.metrics.set(m);
      this.statusEntries.set(Object.entries(m.operationsByStatus) as [string, number][]);
      this.stageEntries.set(Object.entries(m.averageTimePerStage) as [string, number][]);
    });
  }

  applyFilters(): void {
    this.loadMetrics();
  }
}
