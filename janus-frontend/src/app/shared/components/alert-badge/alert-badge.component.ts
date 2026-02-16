import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-alert-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (count() > 0) {
      <span class="badge bg-danger rounded-pill">{{ count() }}</span>
    }
  `
})
export class AlertBadgeComponent implements OnInit {
  private alertService = inject(AlertService);
  count = signal(0);

  ngOnInit(): void {
    this.alertService.getActiveAlerts().subscribe(alerts => {
      this.count.set(alerts.filter(a => a.status === 'ACTIVE').length);
    });
  }
}
