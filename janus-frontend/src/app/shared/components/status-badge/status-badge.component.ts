import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="badge" [ngClass]="getBadgeClass()">{{ getLabel() }}</span>`
})
export class StatusBadgeComponent {
  private translate = inject(TranslateService);
  status = input.required<string>();

  private classMap: Record<string, string> = {
    'DRAFT': 'bg-secondary',
    'DOCUMENTATION_COMPLETE': 'bg-info',
    'DECLARATION_IN_PROGRESS': 'bg-primary',
    'SUBMITTED_TO_CUSTOMS': 'bg-warning text-dark',
    'VALUATION_REVIEW': 'bg-warning text-dark',
    'PAYMENT_PREPARATION': 'bg-info',
    'IN_TRANSIT': 'bg-primary',
    'CLOSED': 'bg-success',
    'CANCELLED': 'bg-danger',
    'PENDING': 'bg-secondary',
    'VALIDATED': 'bg-success',
    'OBSERVED': 'bg-warning text-dark',
    'REQUIRES_REPLACEMENT': 'bg-danger',
    'CREATE': 'bg-success',
    'UPDATE': 'bg-info',
    'DELETE': 'bg-danger',
    'STATUS_CHANGE': 'bg-warning text-dark',
    'UPLOAD': 'bg-primary',
    'DOWNLOAD': 'bg-secondary'
  };

  getBadgeClass(): string {
    return this.classMap[this.status()] ?? 'bg-secondary';
  }

  getLabel(): string {
    const key = `STATUS_SHORT.${this.status()}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : this.status();
  }
}
