import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../../core/services/audit.service';
import { AuditLog } from '../../../core/models/audit.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  template: `
    <h2 class="mb-4">Audit Log</h2>
    <div class="card mb-3">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <input type="text" class="form-control" placeholder="Filter by username..." [(ngModel)]="filterUsername" (ngModelChange)="loadLogs()">
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-body p-0">
        <table class="table table-hover table-sm mb-0">
          <thead class="table-light">
            <tr><th>Date</th><th>User</th><th>Action</th><th>Entity</th><th>ID</th><th>Details</th><th>IP</th></tr>
          </thead>
          <tbody>
            @for (log of logs(); track log.id) {
              <tr>
                <td><small>{{ log.createdAt | date:'medium' }}</small></td>
                <td>{{ log.username }}</td>
                <td><app-status-badge [status]="log.action" /></td>
                <td>{{ log.entityName }}</td>
                <td>{{ log.entityId }}</td>
                <td><small>{{ log.details }}</small></td>
                <td><small>{{ log.ipAddress }}</small></td>
              </tr>
            }
            @if (logs().length === 0) {
              <tr><td colspan="7" class="text-center text-muted py-3">No audit logs found</td></tr>
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
