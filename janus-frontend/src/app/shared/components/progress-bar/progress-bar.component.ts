import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex justify-content-between mb-1">
      @for (step of steps; track step.key; let i = $index) {
        <div class="text-center flex-fill" [class.fw-bold]="i === currentIndex()">
          <small [ngClass]="i <= currentIndex() ? 'text-primary' : 'text-muted'">{{ step.label }}</small>
        </div>
      }
    </div>
    <div class="progress" style="height: 8px;">
      <div class="progress-bar" [style.width.%]="progressPercent()"
           [ngClass]="isFinal() ? 'bg-success' : 'bg-primary'"></div>
    </div>
  `
})
export class ProgressBarComponent {
  status = input.required<string>();

  steps = [
    { key: 'DRAFT', label: 'Draft' },
    { key: 'DOCUMENTATION_COMPLETE', label: 'Docs' },
    { key: 'DECLARATION_IN_PROGRESS', label: 'Declaration' },
    { key: 'SUBMITTED_TO_CUSTOMS', label: 'Submitted' },
    { key: 'VALUATION_REVIEW', label: 'Valuation' },
    { key: 'PAYMENT_PREPARATION', label: 'Payment' },
    { key: 'IN_TRANSIT', label: 'Transit' },
    { key: 'CLOSED', label: 'Closed' }
  ];

  currentIndex = computed(() => {
    const idx = this.steps.findIndex(s => s.key === this.status());
    return idx >= 0 ? idx : 0;
  });

  progressPercent = computed(() => ((this.currentIndex() + 1) / this.steps.length) * 100);
  isFinal = computed(() => this.status() === 'CLOSED' || this.status() === 'CANCELLED');
}
