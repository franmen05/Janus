import { Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex justify-content-between mb-1">
      @for (step of steps; track step.key; let i = $index) {
        <div class="text-center flex-fill" [class.fw-bold]="i === currentIndex()">
          <small [ngClass]="i <= currentIndex() ? 'text-primary' : 'text-muted'">{{ getStepLabel(step.translationKey) }}</small>
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
  private translate = inject(TranslateService);
  status = input.required<string>();

  steps = [
    { key: 'DRAFT', translationKey: 'PROGRESS.DRAFT' },
    { key: 'DOCUMENTATION_COMPLETE', translationKey: 'PROGRESS.DOCS' },
    { key: 'DECLARATION_IN_PROGRESS', translationKey: 'PROGRESS.DECLARATION' },
    { key: 'SUBMITTED_TO_CUSTOMS', translationKey: 'PROGRESS.SUBMITTED' },
    { key: 'VALUATION_REVIEW', translationKey: 'PROGRESS.VALUATION' },
    { key: 'PAYMENT_PREPARATION', translationKey: 'PROGRESS.PAYMENT' },
    { key: 'IN_TRANSIT', translationKey: 'PROGRESS.TRANSIT' },
    { key: 'CLOSED', translationKey: 'PROGRESS.CLOSED' }
  ];

  getStepLabel(key: string): string {
    return this.translate.instant(key);
  }

  currentIndex = computed(() => {
    const idx = this.steps.findIndex(s => s.key === this.status());
    return idx >= 0 ? idx : 0;
  });

  progressPercent = computed(() => ((this.currentIndex() + 1) / this.steps.length) * 100);
  isFinal = computed(() => this.status() === 'CLOSED' || this.status() === 'CANCELLED');
}
