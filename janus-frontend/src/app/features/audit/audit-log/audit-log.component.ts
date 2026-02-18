import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuditService } from '../../../core/services/audit.service';
import { AuditLog } from '../../../core/models/audit.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, StatusBadgeComponent, RouterModule],
  template: `
    <h2 class="mb-4">{{ 'AUDIT.TITLE' | translate }}</h2>
    <div class="card mb-3">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <input type="text" class="form-control" [placeholder]="'AUDIT.FILTER_PLACEHOLDER' | translate" [(ngModel)]="filterUsername" (ngModelChange)="loadLogs()">
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-body p-0 table-responsive">
        <table class="table table-hover table-sm mb-0">
          <thead class="table-light">
            <tr><th>{{ 'AUDIT.DATE' | translate }}</th><th>{{ 'AUDIT.USER' | translate }}</th><th>{{ 'AUDIT.ACTION' | translate }}</th><th class="d-none d-sm-table-cell">{{ 'AUDIT.ENTITY' | translate }}</th><th class="d-none d-sm-table-cell">{{ 'AUDIT.ID' | translate }}</th><th class="d-none d-md-table-cell">{{ 'AUDIT.DETAILS' | translate }}</th><th class="d-none d-lg-table-cell">{{ 'AUDIT.IP' | translate }}</th></tr>
          </thead>
          <tbody>
            @for (log of logs(); track log.id) {
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
  `
})
export class AuditLogComponent implements OnInit {
  private auditService = inject(AuditService);
  logs = signal<AuditLog[]>([]);
  filterUsername = '';

  ngOnInit(): void { this.loadLogs(); }

  loadLogs(): void {
    this.auditService.getAll(this.filterUsername || undefined).subscribe(logs => this.logs.set(logs));
  }
}
