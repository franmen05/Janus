import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { Alert } from '../../../core/models/alert.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';

@Component({
  selector: 'app-alert-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, StatusBadgeComponent, StatusLabelPipe],
  template: `
    <h2 class="mb-4">{{ 'ALERTS.TITLE' | translate }}</h2>

    <div class="card">
      <div class="card-body p-0">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>{{ 'ALERTS.OPERATION' | translate }}</th>
              <th>{{ 'ALERTS.TYPE' | translate }}</th>
              <th>{{ 'COMMON.STATUS' | translate }}</th>
              <th>{{ 'ALERTS.MESSAGE' | translate }}</th>
              <th>{{ 'ALERTS.CREATED_AT' | translate }}</th>
              <th>{{ 'ACTIONS.TITLE' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (alert of alerts(); track alert.id) {
              <tr>
                <td><a [routerLink]="['/operations', alert.operationId]">{{ alert.operationRef }}</a></td>
                <td><app-status-badge [status]="alert.alertType" /></td>
                <td><app-status-badge [status]="alert.status" /></td>
                <td>{{ alert.message }}</td>
                <td>{{ alert.createdAt | date:'medium' }}</td>
                <td>
                  @if (alert.status === 'ACTIVE') {
                    <button class="btn btn-sm btn-outline-warning" (click)="acknowledge(alert)">
                      {{ 'ALERTS.ACKNOWLEDGE' | translate }}
                    </button>
                  } @else {
                    <small class="text-muted">{{ alert.acknowledgedBy }} - {{ alert.acknowledgedAt | date:'short' }}</small>
                  }
                </td>
              </tr>
            }
            @if (alerts().length === 0) {
              <tr><td colspan="6" class="text-center text-muted py-3">{{ 'ALERTS.NO_ALERTS' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AlertListComponent implements OnInit {
  private alertService = inject(AlertService);
  alerts = signal<Alert[]>([]);

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.alertService.getActiveAlerts().subscribe(a => this.alerts.set(a));
  }

  acknowledge(alert: Alert): void {
    this.alertService.acknowledge(alert.id).subscribe(() => this.loadAlerts());
  }
}
