import { Component, input, computed, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

const REVIEW_STATUSES = ['IN_REVIEW', 'PENDING_CORRECTION', 'PRELIQUIDATION_REVIEW', 'ANALYST_ASSIGNED'];

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress-steps-wrapper">
      <div class="d-flex justify-content-between mb-1">
        @for (step of steps; track step.key; let i = $index) {
          <div class="text-center flex-fill text-nowrap px-1"
               [class.fw-bold]="i === currentIndex()"
               [class.step-clickable]="interactive() && i !== currentIndex() && !isFinal()"
               (click)="onStepClick(step.key, i)">
            <small [ngClass]="i <= currentIndex() ? 'text-primary' : 'text-muted'">{{ getStepLabel(step.translationKey) }}</small>
          </div>
        }
      </div>
      <div class="progress" style="height: 8px;">
        <div class="progress-bar" [style.width.%]="progressPercent()"
             [ngClass]="status() === 'CANCELLED' ? 'bg-danger' : (isFinal() ? 'bg-success' : 'bg-primary')"></div>
      </div>
      @if (isInReviewStatus()) {
        <div class="mt-2 text-center">
          <span class="badge" [ngClass]="status() === 'PENDING_CORRECTION' ? 'bg-warning text-dark' : 'bg-info'">
            {{ getReviewSubStatusLabel() }}
          </span>
        </div>
      }
    </div>
  `,
  styles: [`
    .progress-steps-wrapper {
      overflow-x: auto;
      min-width: 0;
    }
    .progress-steps-wrapper > .d-flex {
      min-width: 500px;
    }
    .step-clickable {
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.15s;
    }
    .step-clickable:hover {
      background-color: rgba(13, 110, 253, 0.1);
    }
  `]
})
export class ProgressBarComponent {
  private translate = inject(TranslateService);
  status = input.required<string>();
  interactive = input(false);
  stepClicked = output<string>();

  steps = [
    { key: 'DRAFT', translationKey: 'PROGRESS.DRAFT' },
    { key: 'DOCUMENTATION_COMPLETE', translationKey: 'PROGRESS.DOCS' },
    { key: 'IN_REVIEW', translationKey: 'PROGRESS.REVIEW' },
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

  isInReviewStatus = computed(() => REVIEW_STATUSES.includes(this.status()));

  currentIndex = computed(() => {
    const s = this.status();
    if (REVIEW_STATUSES.includes(s)) {
      return this.steps.findIndex(step => step.key === 'IN_REVIEW');
    }
    if (s === 'PENDING_EXTERNAL_APPROVAL') {
      return this.steps.findIndex(step => step.key === 'VALUATION_REVIEW');
    }
    const idx = this.steps.findIndex(step => step.key === s);
    return idx >= 0 ? idx : 0;
  });

  progressPercent = computed(() => ((this.currentIndex() + 1) / this.steps.length) * 100);
  isFinal = computed(() => this.status() === 'CLOSED' || this.status() === 'CANCELLED');

  getReviewSubStatusLabel(): string {
    const key = 'STATUS.' + this.status();
    const translated = this.translate.instant(key);
    return translated !== key ? translated : this.status();
  }

  onStepClick(stepKey: string, index: number): void {
    if (!this.interactive() || index === this.currentIndex() || this.isFinal()) return;
    this.stepClicked.emit(stepKey);
  }
}
