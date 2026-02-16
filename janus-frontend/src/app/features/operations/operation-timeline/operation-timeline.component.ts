import { Component, input, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TimelineService } from '../../../core/services/timeline.service';
import { TimelineEventResponse, TimelineEventType } from '../../../core/models/timeline.model';
import { TimelineComponent, TimelineEvent } from '../../../shared/components/timeline/timeline.component';

@Component({
  selector: 'app-operation-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, TimelineComponent],
  template: `
    <div class="mb-3">
      <select class="form-select form-select-sm w-auto" [(ngModel)]="selectedType" (ngModelChange)="loadTimeline()">
        <option value="">{{ 'TIMELINE.FILTER_ALL' | translate }}</option>
        @for (type of eventTypes; track type) {
          <option [value]="type">{{ 'TIMELINE.' + type | translate }}</option>
        }
      </select>
    </div>
    @if (timelineEvents().length > 0) {
      <app-timeline [events]="timelineEvents()" />
    } @else {
      <p class="text-muted">{{ 'TIMELINE.NO_EVENTS' | translate }}</p>
    }
  `
})
export class OperationTimelineComponent implements OnInit {
  operationId = input.required<number>();

  private timelineService = inject(TimelineService);
  timelineEvents = signal<TimelineEvent[]>([]);
  selectedType = '';
  eventTypes = Object.values(TimelineEventType);

  ngOnInit(): void { this.loadTimeline(); }

  loadTimeline(): void {
    const type = this.selectedType ? this.selectedType as TimelineEventType : undefined;
    this.timelineService.getTimeline(this.operationId(), type).subscribe(events => {
      this.timelineEvents.set(events.map(e => ({
        title: e.description,
        description: e.previousStatus && e.newStatus ? `${e.previousStatus} → ${e.newStatus}` : '',
        date: e.timestamp,
        user: e.username,
        eventType: e.eventType
      })));
    });
  }
}
