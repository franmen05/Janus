import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-completeness-indicator',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div>
      <div class="d-flex justify-content-between mb-1">
        <small class="fw-bold">{{ 'COMPLETENESS.TITLE' | translate }}</small>
        <small class="fw-bold">{{ percentage() }}%</small>
      </div>
      <div class="progress" style="height: 20px;">
        <div class="progress-bar" [style.width.%]="percentage()" [ngClass]="progressClass()">
          {{ percentage() }}%
        </div>
      </div>
      @if (missing().length > 0) {
        <div class="mt-2">
          <small class="text-muted">{{ 'COMPLETENESS.MISSING' | translate }}</small>
          <ul class="list-unstyled mb-0 ms-2">
            @for (doc of missing(); track doc) {
              <li><small class="text-danger">{{ doc.replace('_', ' ') }}</small></li>
            }
          </ul>
        </div>
      }
    </div>
  `
})
export class CompletenessIndicatorComponent {
  percentage = input.required<number>();
  missing = input<string[]>([]);
  color = input<string>('RED');

  progressClass = computed(() => {
    switch (this.color()) {
      case 'GREEN': return 'bg-success';
      case 'YELLOW': return 'bg-warning text-dark';
      default: return 'bg-danger';
    }
  });
}
