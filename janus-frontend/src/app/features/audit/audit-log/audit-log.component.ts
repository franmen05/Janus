import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuditService } from '../../../core/services/audit.service';
import { AuditLog } from '../../../core/models/audit.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingIndicatorComponent } from '../../../shared/components/loading-indicator/loading-indicator.component';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, StatusBadgeComponent, RouterModule, LoadingIndicatorComponent],
  template: `
    <h2 class="mb-4">{{ 'AUDIT.TITLE' | translate }}</h2>
    @if (loading()) {
      <app-loading-indicator />
    } @else {
    <div class="card mb-3">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <input type="text" class="form-control" [placeholder]="'AUDIT.FILTER_PLACEHOLDER' | translate" [(ngModel)]="filterUsername" (ngModelChange)="loadLogs()">
          </div>
          <div class="col-md-4">
            <input type="date" class="form-control" [placeholder]="'AUDIT.FROM' | translate" [(ngModel)]="filterFrom" (change)="loadLogs()">
          </div>
          <div class="col-md-4">
            <input type="date" class="form-control" [placeholder]="'AUDIT.TO' | translate" [(ngModel)]="filterTo" (change)="loadLogs()">
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-body p-0 table-responsive">
        <table class="table table-hover table-sm mb-0">
          <thead class="table-light">
            <tr><th role="button" (click)="toggleSort('createdAt')">{{ 'AUDIT.DATE' | translate }} {{ sortColumn() === 'createdAt' ? (sortDirection() === 'asc' ? '▲' : '▼') : '' }}</th><th role="button" (click)="toggleSort('username')">{{ 'AUDIT.USER' | translate }} {{ sortColumn() === 'username' ? (sortDirection() === 'asc' ? '▲' : '▼') : '' }}</th><th>{{ 'AUDIT.ACTION' | translate }}</th><th class="d-none d-sm-table-cell">{{ 'AUDIT.ENTITY' | translate }}</th><th class="d-none d-sm-table-cell">{{ 'AUDIT.ID' | translate }}</th><th class="d-none d-md-table-cell">{{ 'AUDIT.DETAILS' | translate }}</th><th class="d-none d-lg-table-cell">{{ 'AUDIT.IP' | translate }}</th></tr>
          </thead>
          <tbody>
            @for (log of sortedLogs(); track log.id) {
              <tr>
                <td><small>{{ log.createdAt | date:'medium' }}</small></td>
                <td>{{ log.username }}</td>
                <td><app-status-badge [status]="log.action" /></td>
                <td class="d-none d-sm-table-cell">
                  @if (log.entityName === 'Document' && log.operationId && log.entityId) {
                    <a [routerLink]="['/operations', log.operationId, 'documents', log.entityId, 'versions']">{{ log.entityName }}</a>
                  } @else {
                    {{ log.entityName }}
                  }
                </td>
                <td class="d-none d-sm-table-cell">
                  @if (log.entityName === 'Document' && log.operationId && log.entityId) {
                    <a [routerLink]="['/operations', log.operationId, 'documents', log.entityId, 'versions']">{{ log.entityId }}</a>
                  } @else {
                    {{ log.entityId }}
                  }
                </td>
                <td class="d-none d-md-table-cell"><small>{{ log.details }}</small></td>
                <td class="d-none d-lg-table-cell"><small>{{ log.ipAddress }}</small></td>
              </tr>
            }
            @if (logs().length === 0) {
              <tr><td colspan="7" class="text-center text-muted py-3">{{ 'AUDIT.NO_LOGS' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
    }
  `
})
export class AuditLogComponent implements OnInit {
  private auditService = inject(AuditService);
  loading = signal(true);
  logs = signal<AuditLog[]>([]);
  filterUsername = '';
  filterFrom = '';
  filterTo = '';
  sortColumn = signal<'createdAt' | 'username'>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');

  sortedLogs = computed(() => {
    const col = this.sortColumn();
    const dir = this.sortDirection();
    return [...this.logs()].sort((a, b) => {
      const valA = a[col] ?? '';
      const valB = b[col] ?? '';
      const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
      return dir === 'asc' ? cmp : -cmp;
    });
  });

  ngOnInit(): void { this.loadLogs(); }

  loadLogs(): void {
    this.auditService.getAll(this.filterUsername || undefined, this.filterFrom || undefined, this.filterTo || undefined).subscribe(logs => {
      this.logs.set(logs);
      this.loading.set(false);
    });
  }

  toggleSort(column: 'createdAt' | 'username'): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }
}
