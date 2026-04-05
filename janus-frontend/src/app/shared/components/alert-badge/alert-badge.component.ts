import { Component, inject } from '@angular/core';

import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-alert-badge',
  standalone: true,
  imports: [],
  template: `
    @if (alertService.activeCount() > 0) {
      <span class="badge bg-danger rounded-pill">{{ alertService.activeCount() }}</span>
    }
  `
})
export class AlertBadgeComponent {
  protected alertService = inject(AlertService);
}
