import { Component, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

export interface TimelineEvent {
  title: string;
  description: string;
  date: string;
  user?: string;
  eventType?: string;
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, DatePipe, TranslateModule],
  template: `
    <div class="timeline">
      @for (event of events(); track $index) {
        <div class="d-flex mb-3">
          <div class="me-3">
            <div class="rounded-circle" [ngClass]="getCircleClass(event.eventType)" style="width: 12px; height: 12px; margin-top: 5px;"></div>
          </div>
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between">
              <strong>{{ event.title }}</strong>
              <small class="text-muted">{{ event.date | date:'medium' }}</small>
            </div>
            <p class="mb-0 text-muted">{{ event.description }}</p>
            @if (event.user) {
              <small class="text-muted">{{ 'TIMELINE.BY' | translate }} {{ event.user }}</small>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class TimelineComponent {
  events = input.required<TimelineEvent[]>();

  private circleClassMap: Record<string, string> = {
    'STATUS_CHANGE': 'bg-primary',
    'DOCUMENT_UPLOAD': 'bg-success',
    'DOCUMENT_VERSION': 'bg-info',
    'COMMENT': 'bg-warning',
    'APPROVAL': 'bg-success',
    'REJECTION': 'bg-danger',
    'ALERT': 'bg-danger'
  };

  getCircleClass(eventType?: string): string {
    return eventType ? (this.circleClassMap[eventType] ?? 'bg-primary') : 'bg-primary';
  }
}
