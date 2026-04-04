import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartEvent, ChartOptions } from 'chart.js';
import { OperationService } from '../../core/services/operation.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { AlertService } from '../../core/services/alert.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { Operation, OperationStatus, TransportMode, OperationCategory } from '../../core/models/operation.model';
import { DashboardMetrics, DashboardFilter } from '../../core/models/dashboard.model';
import { Alert } from '../../core/models/alert.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { StatusLabelPipe } from '../../shared/pipes/status-label.pipe';
import { AlertMessagePipe } from '../../shared/pipes/alert-message.pipe';
import { LoadingIndicatorComponent } from '../../shared/components/loading-indicator/loading-indicator.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, BaseChartDirective, StatusBadgeComponent, StatusLabelPipe, AlertMessagePipe, LoadingIndicatorComponent],
  styles: [`
    :host { display: block; }

    .dashboard-header h4 {
      color: var(--janus-text-primary);
      font-family: 'DM Sans', sans-serif;
      font-weight: 600;
    }

    .card-filter {
      background-color: var(--janus-bg-card);
      border: 1px solid var(--janus-border);
      border-radius: 12px;
    }

    .card-filter .form-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--janus-text-muted);
    }

    .kpi-card {
      position: relative;
      border-radius: 12px;
      padding: 1.25rem;
      border: 1px solid var(--janus-border);
      transition: transform 0.15s ease, box-shadow 0.2s ease;
      overflow: hidden;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--janus-shadow-card-hover);
    }

    .kpi-card::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
    }

    .kpi-card--indigo {
      background: linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0.02) 100%);
    }
    .kpi-card--indigo::after { background-color: #6366f1; }
    .kpi-card--indigo .kpi-dot { background-color: #6366f1; }

    .kpi-card--red {
      background: linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.02) 100%);
    }
    .kpi-card--red::after { background-color: #ef4444; }
    .kpi-card--red .kpi-dot { background-color: #ef4444; }

    .kpi-card--amber {
      background: linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.02) 100%);
    }
    .kpi-card--amber::after { background-color: #f59e0b; }
    .kpi-card--amber .kpi-dot { background-color: #f59e0b; }

    .kpi-card--green {
      background: linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.02) 100%);
    }
    .kpi-card--green::after { background-color: #22c55e; }
    .kpi-card--green .kpi-dot { background-color: #22c55e; }

    .kpi-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 0.5rem;
    }

    .kpi-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--janus-text-secondary);
      font-weight: 500;
    }

    .kpi-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 2rem;
      font-weight: 600;
      color: var(--janus-text-primary);
      line-height: 1.2;
    }

    .mono {
      font-family: 'JetBrains Mono', monospace;
    }

    .data-card .card-header h6 {
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--janus-text-primary);
    }

    .close-rate-pill {
      display: inline-block;
      padding: 0.2em 0.65em;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      font-family: 'JetBrains Mono', monospace;
    }

    .close-rate-pill--green {
      background-color: rgba(34, 197, 94, 0.12);
      color: #22c55e;
    }

    .close-rate-pill--yellow {
      background-color: rgba(245, 158, 11, 0.12);
      color: #f59e0b;
    }

    .close-rate-pill--red {
      background-color: rgba(239, 68, 68, 0.12);
      color: #ef4444;
    }

    .alert-card {
      border-left: 4px solid #f59e0b;
    }

    .alert-card .card-header {
      background-color: rgba(245, 158, 11, 0.05);
    }

    .data-card .table tbody tr:hover {
      background-color: rgba(99, 102, 241, 0.06);
    }

    .chart-container {
      position: relative;
      width: 100%;
    }

    .polar-chart-container {
      height: 320px;
    }

    .polar-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .polar-header-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.15) 100%);
      color: #6366f1;
      font-size: 1.1rem;
    }

    .polar-header-text h6 {
      margin-bottom: 0;
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--janus-text-primary);
    }

    .polar-header-text small {
      color: var(--janus-text-muted);
      font-size: 0.72rem;
    }

    .bar-chart-container {
      height: 260px;
    }

    .productivity-chart-container {
      height: 260px;
    }
  `],
  template: `
    <!-- Page header -->
    <div class="dashboard-header d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-semibold mb-1">{{ 'DASHBOARD.TITLE' | translate }}</h4>
        <p class="text-muted small mb-0">{{ 'DASHBOARD.SUBTITLE' | translate }}</p>
      </div>
    </div>

    @if (loading()) {
      <app-loading-indicator />
    } @else if (authService.hasRole(['ADMIN', 'AGENT', 'ACCOUNTING'])) {
      <!-- Filter bar -->
      <div class="card card-filter mb-4">
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
              <label class="form-label form-label-sm mb-0">{{ 'DASHBOARD.FILTER_TRANSPORT' | translate }}</label>
              <select class="form-select form-select-sm" [(ngModel)]="filterTransport">
                <option value="">{{ 'DASHBOARD.FILTER_ALL' | translate }}</option>
                @for (t of transportModes; track t) { <option [value]="t">{{ t | statusLabel }}</option> }
              </select>
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label form-label-sm mb-0">{{ 'DASHBOARD.FILTER_CATEGORY' | translate }}</label>
              <select class="form-select form-select-sm" [(ngModel)]="filterCategory">
                <option value="">{{ 'DASHBOARD.FILTER_ALL' | translate }}</option>
                @for (t of operationCategories; track t) { <option [value]="t">{{ t | statusLabel }}</option> }
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
      <div class="row mb-4 g-3">
        <div class="col-6 col-md-3">
          <div class="kpi-card kpi-card--indigo">
            <div class="d-flex align-items-center mb-2">
              <span class="kpi-dot"></span>
              <span class="kpi-label">{{ 'DASHBOARD.ACTIVE' | translate }}</span>
            </div>
            <div class="kpi-value">{{ activeCount() }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="kpi-card kpi-card--red">
            <div class="d-flex align-items-center mb-2">
              <span class="kpi-dot"></span>
              <span class="kpi-label">{{ 'DASHBOARD.OVERDUE' | translate }}</span>
            </div>
            <div class="kpi-value">{{ metrics()?.overdueCount ?? 0 }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="kpi-card kpi-card--amber">
            <div class="d-flex align-items-center mb-2">
              <span class="kpi-dot"></span>
              <span class="kpi-label">{{ 'DASHBOARD.REJECTION_RATE' | translate }}</span>
            </div>
            <div class="kpi-value">{{ (metrics()?.rejectionRate ?? 0) | number:'1.1-1' }}%</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="kpi-card kpi-card--green">
            <div class="d-flex align-items-center mb-2">
              <span class="kpi-dot"></span>
              <span class="kpi-label">{{ 'DASHBOARD.CLOSED' | translate }}</span>
            </div>
            <div class="kpi-value">{{ closedCount() }}</div>
          </div>
        </div>
      </div>

      <!-- Row 2: Status table + Bar chart -->
      <div class="row mb-4 g-3">
        <!-- Operations by Status - Table -->
        <div class="col-12 col-md-5">
          <div class="card data-card h-100">
            <div class="card-header"><h6 class="mb-0">{{ 'DASHBOARD.OPS_BY_STATUS' | translate }}</h6></div>
            <div class="card-body p-0 table-responsive">
              <table class="table table-sm mb-0">
                <thead class="table-light"><tr><th>{{ 'COMMON.STATUS' | translate }}</th><th>{{ 'DASHBOARD.COUNT' | translate }}</th></tr></thead>
                <tbody>
                  @for (entry of statusEntries(); track entry[0]) {
                    <tr style="cursor: pointer;" (click)="navigateToOperations(entry[0])">
                      <td><app-status-badge [status]="entry[0]" /></td><td class="mono">{{ entry[1] }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <!-- Average Time per Stage + Status Distribution -->
        <div class="col-12 col-md-7 d-flex flex-column gap-3">
          <div class="card data-card">
            <div class="card-header"><h6 class="mb-0">{{ 'DASHBOARD.CHART_AVG_TIME' | translate }}</h6></div>
            <div class="card-body">
              @if (timeBarData().labels?.length) {
                <div class="bar-chart-container">
                  <canvas baseChart
                    [data]="timeBarData()"
                    [options]="timeBarOptions()"
                    type="bar">
                  </canvas>
                </div>
              }
            </div>
          </div>
          @if (polarData().labels?.length) {
            <div class="card data-card">
              <div class="card-header">
                <div class="polar-header">
                  <div class="polar-header-icon"><i class="bi bi-pie-chart-fill"></i></div>
                  <div class="polar-header-text">
                    <h6>{{ 'DASHBOARD.CHART_STATUS_DIST' | translate }}</h6>
                    <small>{{ 'DASHBOARD.CHART_STATUS_DIST_SUB' | translate }}</small>
                  </div>
                </div>
              </div>
              <div class="card-body">
                <div class="polar-chart-container">
                  <canvas baseChart
                    [data]="polarData()"
                    [options]="polarOptions()"
                    (chartClick)="onPolarChartClick($event)"
                    type="polarArea">
                  </canvas>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Row 3: Productivity -->
      @if (metrics()?.productivityByAgent?.length) {
        <div class="row mb-4 g-3">
          <div class="col-12 col-md-7">
            <div class="card data-card h-100">
              <div class="card-header"><h6 class="mb-0">{{ 'DASHBOARD.CHART_PRODUCTIVITY' | translate }}</h6></div>
              <div class="card-body">
                <div class="productivity-chart-container">
                  <canvas baseChart
                    [data]="productivityData()"
                    [options]="productivityOptions()"
                    type="bar">
                  </canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Row 3: Alerts -->
      <div class="row mb-4 g-3">
        <!-- Active Alerts -->
        @if (activeAlerts().length > 0) {
          <div class="col-12 col-md-5">
            <div class="card alert-card h-100">
              <div class="card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
                <h6 class="mb-0">{{ 'DASHBOARD.ACTIVE_ALERTS' | translate }} ({{ activeAlerts().length }})</h6>
                <a routerLink="/alerts" class="btn btn-sm btn-outline-warning">{{ 'DASHBOARD.VIEW_ALL' | translate }}</a>
              </div>
              <div class="card-body p-0 table-responsive">
                <table class="table table-sm mb-0">
                  <thead>
                    <tr><th>{{ 'ALERTS.OPERATION' | translate }}</th><th>{{ 'ALERTS.TYPE' | translate }}</th><th class="d-none d-md-table-cell">{{ 'ALERTS.MESSAGE' | translate }}</th><th>{{ 'ALERTS.CREATED' | translate }}</th></tr>
                  </thead>
                  <tbody>
                    @for (alert of activeAlerts().slice(0, 5); track alert.id) {
                      <tr>
                        <td><a [routerLink]="['/operations', alert.operationId]">{{ alert.operationRef }}</a></td>
                        <td><span class="badge" [class]="alert.alertType === 'DEADLINE_APPROACHING' ? 'bg-danger' : 'bg-warning text-dark'">{{ alert.alertType | statusLabel }}</span></td>
                        <td class="d-none d-md-table-cell">{{ alert | alertMessage }}</td>
                        <td class="mono">{{ alert.createdAt | date:'short' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      </div>
    } @else {
      <!-- Simple view for CLIENT/CARRIER -->
      <div class="row mb-4 g-3">
        <div class="col-6 col-md-3">
          <div class="kpi-card kpi-card--indigo">
            <div class="d-flex align-items-center mb-2">
              <span class="kpi-dot"></span>
              <span class="kpi-label">{{ 'DASHBOARD.ACTIVE' | translate }}</span>
            </div>
            <div class="kpi-value">{{ activeCount() }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="kpi-card kpi-card--green">
            <div class="d-flex align-items-center mb-2">
              <span class="kpi-dot"></span>
              <span class="kpi-label">{{ 'DASHBOARD.CLOSED' | translate }}</span>
            </div>
            <div class="kpi-value">{{ closedCount() }}</div>
          </div>
        </div>
      </div>
      <div class="card data-card">
        <div class="card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <h6 class="mb-0">{{ 'DASHBOARD.RECENT_OPERATIONS' | translate }}</h6>
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
                  <td class="d-none d-sm-table-cell mono">{{ op.createdAt | date:'shortDate' }}</td>
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
  private themeService = inject(ThemeService);
  private translateService = inject(TranslateService);
  private router = inject(Router);
  authService = inject(AuthService);

  loading = signal(true);
  recentOperations = signal<Operation[]>([]);
  metrics = signal<DashboardMetrics | null>(null);
  activeCount = signal(0);
  closedCount = signal(0);
  statusEntries = signal<[string, number][]>([]);
  stageEntries = signal<[string, number][]>([]);
  activeAlerts = signal<Alert[]>([]);

  // Chart signals
  polarData = signal<ChartData<'polarArea'>>({ labels: [], datasets: [] });
  polarOptions = signal<ChartOptions<'polarArea'>>({});
  timeBarData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  timeBarOptions = signal<ChartOptions<'bar'>>({});
  productivityData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  productivityOptions = signal<ChartOptions<'bar'>>({});

  filterFrom = '';
  filterTo = '';
  filterTransport = '';
  filterCategory = '';
  filterAgent = '';
  transportModes = Object.values(TransportMode);
  operationCategories = Object.values(OperationCategory);

  private polarStatusKeys: string[] = [];

  // Status color mapping for the doughnut chart
  private statusColorMap: Record<string, string> = {
    'DRAFT': '#6b7280',
    'DOCUMENTATION_COMPLETE': '#3b82f6',
    'IN_REVIEW': '#3b82f6',
    'PENDING_CORRECTION': '#f59e0b',
    'PRELIQUIDATION_REVIEW': '#3b82f6',
    'ANALYST_ASSIGNED': '#3b82f6',
    'DECLARATION_IN_PROGRESS': '#6366f1',
    'SUBMITTED_TO_CUSTOMS': '#f59e0b',
    'VALUATION_REVIEW': '#f59e0b',
    'PAYMENT_PREPARATION': '#3b82f6',
    'IN_TRANSIT': '#6366f1',
    'CLOSED': '#22c55e',
    'CANCELLED': '#ef4444'
  };

  constructor() {
    // React to theme changes and update chart colors
    effect(() => {
      const _theme = this.themeService.effectiveTheme();
      this.updateChartThemeColors();
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.operationService.getAll().subscribe(ops => {
      this.recentOperations.set(ops.slice(0, 10));
      this.activeCount.set(ops.filter(o => o.status !== OperationStatus.CLOSED && o.status !== OperationStatus.CANCELLED && o.status !== OperationStatus.DRAFT).length);
      this.closedCount.set(ops.filter(o => o.status === OperationStatus.CLOSED).length);
      this.loading.set(false);
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
    if (this.filterTransport) filter.transportMode = this.filterTransport;
    if (this.filterCategory) filter.operationCategory = this.filterCategory;
    if (this.filterAgent) filter.agentUsername = this.filterAgent;

    this.dashboardService.getMetrics(filter).subscribe(m => {
      this.metrics.set(m);
      this.statusEntries.set(Object.entries(m.operationsByStatus) as [string, number][]);
      this.stageEntries.set(Object.entries(m.averageTimePerStage) as [string, number][]);
      this.buildCharts(m);
    });
  }

  applyFilters(): void {
    this.loadMetrics();
  }

  private getThemeColors() {
    const style = getComputedStyle(document.documentElement);
    return {
      textPrimary: style.getPropertyValue('--janus-text-primary').trim() || '#1a1d2d',
      textSecondary: style.getPropertyValue('--janus-text-secondary').trim() || '#6b7280',
      border: style.getPropertyValue('--janus-border').trim() || 'rgba(0,0,0,0.08)',
      fontBody: style.getPropertyValue('--janus-font-body').trim() || "'DM Sans', sans-serif"
    };
  }

  private buildCharts(m: DashboardMetrics): void {
    this.buildPolarChart(m);
    this.buildTimeBarChart(m);
    this.buildProductivityChart(m);
  }

  // Votrex-style pastel colors for polar chart
  private polarColors = [
    'rgba(101, 147, 245, 0.7)',   // blue
    'rgba(80, 205, 176, 0.7)',    // teal
    'rgba(250, 190, 88, 0.7)',    // amber
    'rgba(240, 108, 120, 0.7)',   // coral
    'rgba(162, 132, 246, 0.7)',   // purple
    'rgba(240, 140, 180, 0.7)',   // pink
    'rgba(100, 210, 230, 0.7)',   // cyan
    'rgba(180, 200, 100, 0.7)',   // lime
    'rgba(210, 150, 100, 0.7)',   // tan
    'rgba(140, 160, 210, 0.7)',   // slate
    'rgba(120, 200, 140, 0.7)',   // green
    'rgba(200, 130, 200, 0.7)',   // magenta
    'rgba(160, 180, 190, 0.7)',   // gray
    'rgba(230, 160, 100, 0.7)',   // orange
  ];

  private buildPolarChart(m: DashboardMetrics): void {
    const entries = Object.entries(m.operationsByStatus).filter(([, count]) => (count as number) > 0) as [string, number][];
    if (!entries.length) {
      this.polarData.set({ labels: [], datasets: [] });
      this.polarStatusKeys = [];
      return;
    }
    this.polarStatusKeys = entries.map(([status]) => status);
    const labels = entries.map(([status]) => {
      const key = `STATUS_SHORT.${status}`;
      const translated = this.translateService.instant(key);
      return translated !== key ? translated : status;
    });
    const data = entries.map(([, count]) => count);
    const colors = entries.map((_, i) => this.polarColors[i % this.polarColors.length]);
    const borderColors = colors.map(c => c.replace('0.7)', '1)'));

    const themeColors = this.getThemeColors();

    this.polarData.set({
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 2
      }]
    });

    this.polarOptions.set({
      responsive: true,
      maintainAspectRatio: false,
      onHover: (event: any, elements: any[]) => {
        const target = event.native?.target as HTMLElement;
        if (target) {
          target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 800
      },
      scales: {
        r: {
          display: false
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: themeColors.textSecondary,
            font: { family: themeColors.fontBody, size: 11 },
            padding: 14,
            usePointStyle: true,
            pointStyleWidth: 10
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: { family: themeColors.fontBody },
          bodyFont: { family: themeColors.fontBody },
          padding: 10,
          cornerRadius: 8
        }
      }
    });
  }

  private buildTimeBarChart(m: DashboardMetrics): void {
    const entries = Object.entries(m.averageTimePerStage) as [string, number][];
    const labels = entries.map(([stage]) => {
      const key = `STATUS_SHORT.${stage}`;
      const translated = this.translateService.instant(key);
      return translated !== key ? translated : stage;
    });
    const data = entries.map(([, hours]) => hours);
    const themeColors = this.getThemeColors();
    const hoursLabel = this.translateService.instant('DASHBOARD.HOURS');

    // Gradient colors from blue to indigo
    const barColors = data.map((_, i) => {
      const ratio = entries.length > 1 ? i / (entries.length - 1) : 0;
      const r = Math.round(59 + (99 - 59) * ratio);
      const g = Math.round(130 + (102 - 130) * ratio);
      const b = Math.round(246 + (241 - 246) * ratio);
      return `rgb(${r}, ${g}, ${b})`;
    });

    this.timeBarData.set({
      labels,
      datasets: [{
        data,
        backgroundColor: barColors,
        borderRadius: 4,
        borderSkipped: false,
        barThickness: 18
      }]
    });

    this.timeBarOptions.set({
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      animation: {
        duration: 800
      },
      scales: {
        x: {
          grid: {
            color: themeColors.border
          },
          ticks: {
            color: themeColors.textSecondary,
            font: { family: themeColors.fontBody, size: 11 },
            callback: (value) => `${value} ${hoursLabel}`
          }
        },
        y: {
          grid: { display: false },
          ticks: {
            color: themeColors.textSecondary,
            font: { family: themeColors.fontBody, size: 11 }
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: { family: themeColors.fontBody },
          bodyFont: { family: themeColors.fontBody },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => `${(ctx.parsed.x ?? 0).toFixed(1)} ${hoursLabel}`
          }
        }
      }
    });
  }

  private buildProductivityChart(m: DashboardMetrics): void {
    if (!m.productivityByAgent?.length) return;

    const labels = m.productivityByAgent.map(a => a.agentFullName);
    const handled = m.productivityByAgent.map(a => a.operationsHandled);
    const closed = m.productivityByAgent.map(a => a.operationsClosed);
    const themeColors = this.getThemeColors();
    const handledLabel = this.translateService.instant('DASHBOARD.HANDLED');
    const closedLabel = this.translateService.instant('DASHBOARD.CLOSED');

    this.productivityData.set({
      labels,
      datasets: [
        {
          label: handledLabel,
          data: handled,
          backgroundColor: '#6366f1',
          borderRadius: 4,
          borderSkipped: false
        },
        {
          label: closedLabel,
          data: closed,
          backgroundColor: '#22c55e',
          borderRadius: 4,
          borderSkipped: false
        }
      ]
    });

    this.productivityOptions.set({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: themeColors.textSecondary,
            font: { family: themeColors.fontBody, size: 11 }
          }
        },
        y: {
          grid: {
            color: themeColors.border
          },
          ticks: {
            color: themeColors.textSecondary,
            font: { family: themeColors.fontBody, size: 11 },
            stepSize: 1
          },
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: themeColors.textSecondary,
            font: { family: themeColors.fontBody, size: 12 },
            usePointStyle: true,
            pointStyleWidth: 10,
            padding: 16
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: { family: themeColors.fontBody },
          bodyFont: { family: themeColors.fontBody },
          padding: 10,
          cornerRadius: 8
        }
      }
    });
  }

  private updateChartThemeColors(): void {
    const m = this.metrics();
    if (m) {
      this.buildCharts(m);
    }
  }

  navigateToOperations(status: string): void {
    this.router.navigate(['/operations'], { queryParams: { status } });
  }

  onPolarChartClick(event: { event?: ChartEvent; active?: any[] }): void {
    if (event.active && event.active.length > 0) {
      const index = event.active[0].index;
      const status = this.polarStatusKeys[index];
      if (status) {
        this.navigateToOperations(status);
      }
    }
  }

  getStageBarWidth(hours: number): number {
    const entries = this.stageEntries();
    if (!entries.length) return 0;
    const max = Math.max(...entries.map(e => e[1]));
    return max > 0 ? (hours / max) * 100 : 0;
  }
}
