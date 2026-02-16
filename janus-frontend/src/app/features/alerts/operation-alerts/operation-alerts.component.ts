import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AlertService } from '../../../core/services/alert.service';
import { Alert } from '../../../core/models/alert.model';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';

@Component({
  selector: 'app-operation-alerts',
  standalone: true,
  imports: [CommonModule, TranslateModule, StatusLabelPipe],
  template: `
    @for (alert of activeAlerts(); track alert.id) {
      <div class="alert alert-warning d-flex justify-content-between align-items-center mb-2">
        <div>
          <strong>{{ alert.alertType | statusLabel }}:</strong> {{ alert.message }}
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
  activeAlerts = signal<Alert[]>([]);

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.alertService.getByOperation(this.operationId()).subscribe(alerts => {
      this.activeAlerts.set(alerts.filter(a => a.status === 'ACTIVE'));
    });
  }

  acknowledge(alert: Alert): void {
    this.alertService.acknowledge(alert.id).subscribe(() => this.loadAlerts());
  }
}
