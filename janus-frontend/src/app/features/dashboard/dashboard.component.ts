import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import {  ChartData, ChartEvent, ChartOptions } from 'chart.js';
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
  styleUrl: 'dashboard.component.scss' ,
  templateUrl: 'dashboard.component.html'
})

export class DashboardComponent implements OnInit {
  private operationService = inject(OperationService);
  private dashboardService = inject(DashboardService);
  private alertService = inject(AlertService);
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

      this.updateChartThemeColors();
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.operationService.getAll(undefined, undefined, undefined, 0, 9999).subscribe(response => {
      const ops = response.content;
      this.recentOperations.set(ops.slice(0, 10));
      this.activeCount.set(ops.filter((o: Operation) => o.status !== OperationStatus.CLOSED && o.status !== OperationStatus.CANCELLED && o.status !== OperationStatus.DRAFT).length);
      this.closedCount.set(ops.filter((o: Operation) => o.status === OperationStatus.CLOSED).length);
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

  navigateToOperations(filterOrStatus: string): void {
    if (filterOrStatus === 'active' || filterOrStatus === 'overdue') {
      this.router.navigate(['/operations'], { queryParams: { filter: filterOrStatus } });
    } else {
      this.router.navigate(['/operations'], { queryParams: { status: filterOrStatus } });
    }
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
