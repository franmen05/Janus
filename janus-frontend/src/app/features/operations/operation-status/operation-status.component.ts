import { Component, input, output, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OperationService } from '../../../core/services/operation.service';
import { OperationStatus, StatusHistory } from '../../../core/models/operation.model';
import { TimelineComponent, TimelineEvent } from '../../../shared/components/timeline/timeline.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-operation-status',
  standalone: true,
  imports: [CommonModule, FormsModule, TimelineComponent],
  template: `
    @if (authService.hasRole(['ADMIN', 'AGENT'])) {
      <div class="card mb-3">
        <div class="card-header">Change Status</div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <select class="form-select" [(ngModel)]="selectedStatus">
                <option value="">Select new status...</option>
                @for (s of availableStatuses; track s) { <option [value]="s">{{ s }}</option> }
              </select>
            </div>
            <div class="col-md-5">
              <input type="text" class="form-control" placeholder="Comment (optional)" [(ngModel)]="comment">
            </div>
            <div class="col-md-3">
              <button class="btn btn-primary w-100" (click)="onChangeStatus()" [disabled]="!selectedStatus">Change Status</button>
            </div>
          </div>
        </div>
      </div>
    }
    <div class="card">
      <div class="card-header">Status History</div>
      <div class="card-body">
        <app-timeline [events]="timelineEvents()" />
      </div>
    </div>
  `
})
export class OperationStatusComponent implements OnInit {
  operationId = input.required<number>();
  currentStatus = input.required<string>();
  statusChanged = output<void>();

  private operationService = inject(OperationService);
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
    this.operationService.changeStatus(this.operationId(), {
      newStatus: this.selectedStatus as OperationStatus,
      comment: this.comment || undefined
    }).subscribe({
      next: () => { this.selectedStatus = ''; this.comment = ''; this.loadHistory(); this.statusChanged.emit(); },
      error: (err) => alert(err.error?.error ?? 'Failed to change status')
    });
  }
}
