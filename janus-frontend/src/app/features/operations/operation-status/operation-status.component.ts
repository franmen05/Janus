import { Component, input, output, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OperationService } from '../../../core/services/operation.service';
import { OperationStatus, StatusHistory } from '../../../core/models/operation.model';
import { CompletenessResponse, DocumentStatus } from '../../../core/models/document.model';
import { TimelineComponent, TimelineEvent } from '../../../shared/components/timeline/timeline.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-operation-status',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, TimelineComponent],
  template: `
    @if (authService.hasRole(['ADMIN', 'AGENT'])) {
      <div class="card mb-3">
        <div class="card-header">{{ 'STATUS_CHANGE.TITLE' | translate }}</div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <select class="form-select" [(ngModel)]="selectedStatus">
                <option value="">{{ 'STATUS_CHANGE.SELECT_STATUS' | translate }}</option>
                @for (s of availableStatuses; track s) { <option [value]="s">{{ s }}</option> }
              </select>
            </div>
            <div class="col-md-5">
              <input type="text" class="form-control" [placeholder]="'STATUS_CHANGE.COMMENT_PLACEHOLDER' | translate" [(ngModel)]="comment">
            </div>
            <div class="col-md-3">
              <button class="btn btn-primary w-100" (click)="onChangeStatus()" [disabled]="!selectedStatus">{{ 'STATUS_CHANGE.BUTTON' | translate }}</button>
            </div>
          </div>
        </div>
      </div>
    }
    <div class="card">
      <div class="card-header">{{ 'STATUS_CHANGE.HISTORY' | translate }}</div>
      <div class="card-body">
        <app-timeline [events]="timelineEvents()" />
      </div>
    </div>
  `
})
export class OperationStatusComponent implements OnInit {
  operationId = input.required<number>();
  currentStatus = input.required<string>();
  completeness = input<CompletenessResponse | null>(null);
  documents = input<{status: string}[]>([]);
  statusChanged = output<void>();

  private operationService = inject(OperationService);
  private translate = inject(TranslateService);
  authService = inject(AuthService);
  timelineEvents = signal<TimelineEvent[]>([]);
  selectedStatus = '';
  comment = '';
  availableStatuses = Object.values(OperationStatus);

  ngOnInit(): void { this.loadHistory(); }

  loadHistory(): void {
    this.operationService.getHistory(this.operationId()).subscribe(h => {
      this.timelineEvents.set(h.map(item => ({
        title: (item.previousStatus ?? 'NEW') + ' → ' + item.newStatus,
        description: item.comment ?? '',
        date: item.changedAt,
        user: item.changedByUsername
      })));
    });
  }

  onChangeStatus(): void {
    if (!this.selectedStatus) return;

    if (this.selectedStatus === OperationStatus.DOCUMENTATION_COMPLETE) {
      const comp = this.completeness();
      if (comp && comp.percentage < 100) {
        const missing = comp.missingDocuments.join(', ');
        alert(this.translate.instant('STATUS_CHANGE.MISSING_DOCS', { missing, percentage: comp.percentage }));
        return;
      }

      const blockedDocs = this.documents().filter(
        d => d.status === DocumentStatus.OBSERVED || d.status === DocumentStatus.REQUIRES_REPLACEMENT
      );
      if (blockedDocs.length > 0) {
        alert(this.translate.instant('STATUS_CHANGE.BLOCKED_DOCS', { count: blockedDocs.length }));
        return;
      }
    }

    this.operationService.changeStatus(this.operationId(), {
      newStatus: this.selectedStatus as OperationStatus,
      comment: this.comment || undefined
    }).subscribe({
      next: () => { this.selectedStatus = ''; this.comment = ''; this.loadHistory(); this.statusChanged.emit(); },
      error: (err) => alert(err.error?.error ?? this.translate.instant('STATUS_CHANGE.FAILED'))
    });
  }
}
