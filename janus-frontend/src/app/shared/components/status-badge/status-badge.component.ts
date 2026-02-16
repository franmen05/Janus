import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="badge" [ngClass]="getBadgeClass()">{{ getLabel() }}</span>`
})
export class StatusBadgeComponent {
  status = input.required<string>();

  private statusMap: Record<string, { label: string; class: string }> = {
    'DRAFT': { label: 'Draft', class: 'bg-secondary' },
    'DOCUMENTATION_COMPLETE': { label: 'Docs Complete', class: 'bg-info' },
    'DECLARATION_IN_PROGRESS': { label: 'Declaration', class: 'bg-primary' },
    'SUBMITTED_TO_CUSTOMS': { label: 'Submitted', class: 'bg-warning text-dark' },
    'VALUATION_REVIEW': { label: 'Valuation', class: 'bg-warning text-dark' },
    'PAYMENT_PREPARATION': { label: 'Payment', class: 'bg-info' },
    'IN_TRANSIT': { label: 'In Transit', class: 'bg-primary' },
    'CLOSED': { label: 'Closed', class: 'bg-success' },
    'CANCELLED': { label: 'Cancelled', class: 'bg-danger' },
    'PENDING': { label: 'Pending', class: 'bg-secondary' },
    'VALIDATED': { label: 'Validated', class: 'bg-success' },
    'OBSERVED': { label: 'Observed', class: 'bg-warning text-dark' },
    'REQUIRES_REPLACEMENT': { label: 'Replace', class: 'bg-danger' },
    'CREATE': { label: 'Create', class: 'bg-success' },
    'UPDATE': { label: 'Update', class: 'bg-info' },
    'DELETE': { label: 'Delete', class: 'bg-danger' },
    'STATUS_CHANGE': { label: 'Status Change', class: 'bg-warning text-dark' },
    'UPLOAD': { label: 'Upload', class: 'bg-primary' },
    'DOWNLOAD': { label: 'Download', class: 'bg-secondary' }
  };

  getBadgeClass(): string {
    return this.statusMap[this.status()]?.class ?? 'bg-secondary';
  }

  getLabel(): string {
    return this.statusMap[this.status()]?.label ?? this.status();
  }
}
