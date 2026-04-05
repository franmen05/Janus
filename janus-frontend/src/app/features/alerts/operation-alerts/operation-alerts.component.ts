import { Component, inject, input, OnInit, signal } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { Alert } from '../../../core/models/alert.model';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';
import { AlertMessagePipe } from '../../../shared/pipes/alert-message.pipe';

@Component({
  selector: 'app-operation-alerts',
  standalone: true,
  imports: [TranslateModule, StatusLabelPipe, AlertMessagePipe],
  template: `
    @for (alert of activeAlerts(); track alert.id) {
      <div class="alert alert-warning d-flex justify-content-between align-items-center mb-2">
        <div>
          <strong>{{ alert.alertType | statusLabel }}:</strong> {{ alert | alertMessage }}
        </div>
        <button class="btn btn-sm btn-outline-warning" (click)="acknowledge(alert)">
          {{ 'ALERTS.ACKNOWLEDGE' | translate }}
        </button>
      </div>
    }
  `
})
export class OperationAlertsComponent implements OnInit {
  operationId = input.required<number>();
  private alertService = inject(AlertService);
  private authService = inject(AuthService);
  activeAlerts = signal<Alert[]>([]);

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts(): void {
    if (this.authService.hasRole(['ADMIN', 'SUPERVISOR', 'AGENT', 'ACCOUNTING', 'CUSTOMER'])) {
      this.alertService.getByOperation(this.operationId()).subscribe(alerts => {
        this.activeAlerts.set(alerts.filter(a => a.status === 'ACTIVE'));
      });
    }
  }

  acknowledge(alert: Alert): void {
    this.alertService.acknowledge(alert.id).subscribe(() => this.loadAlerts());
  }
}
