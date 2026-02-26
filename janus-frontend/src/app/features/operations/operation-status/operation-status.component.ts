import { Component, input, output, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OperationService } from '../../../core/services/operation.service';
import { ComplianceService } from '../../../core/services/compliance.service';
import { OperationStatus } from '../../../core/models/operation.model';
import { CompletenessResponse } from '../../../core/models/document.model';
import { ValidationError } from '../../../core/models/compliance.model';
import { TimelineComponent, TimelineEvent } from '../../../shared/components/timeline/timeline.component';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { OperationTimelineComponent } from '../operation-timeline/operation-timeline.component';

@Component({
  selector: 'app-operation-status',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbNavModule, TranslateModule, TimelineComponent, StatusLabelPipe, OperationTimelineComponent],
  template: `
    @if (authService.hasRole(['ADMIN', 'AGENT'])) {
      <div class="card mb-3">
        <div class="card-header">{{ 'STATUS_CHANGE.TITLE' | translate }}</div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <select class="form-select" [(ngModel)]="selectedStatus">
                <option value="">{{ 'STATUS_CHANGE.SELECT_STATUS' | translate }}</option>
                @for (s of availableStatuses(); track s) { <option [value]="s">{{ s | statusLabel }}</option> }
              </select>
            </div>
            <div class="col-md-5">
              <input type="text" class="form-control" [placeholder]="'STATUS_CHANGE.COMMENT_PLACEHOLDER' | translate" [(ngModel)]="comment">
            </div>
            <div class="col-md-3">
              <button class="btn btn-primary w-100" (click)="onChangeStatus()" [disabled]="!selectedStatus || isValidating()">
                @if (isValidating()) {
                  <span class="spinner-border spinner-border-sm me-1"></span>{{ 'STATUS_CHANGE.VALIDATING' | translate }}
                } @else {
                  {{ 'STATUS_CHANGE.BUTTON' | translate }}
                }
              </button>
            </div>
          </div>
          @if (validationErrors().length > 0) {
            <div class="alert alert-danger mt-3 mb-0">
              <strong>{{ 'COMPLIANCE.VALIDATION_FAILED' | translate }}</strong>
              <ul class="mb-0 mt-1">
                @for (err of validationErrors(); track err.ruleCode) {
                  <li>{{ translateError(err) }}</li>
                }
              </ul>
            </div>
          }
        </div>
      </div>
    }
    <ul ngbNav #subNav="ngbNav" class="nav-pills nav-fill mb-3" [(activeId)]="activeSubTab">
      <li [ngbNavItem]="'status-history'">
        <button ngbNavLink>{{ 'STATUS_CHANGE.HISTORY' | translate }}</button>
        <ng-template ngbNavContent>
          <div class="card">
            <div class="card-body">
              <app-timeline [events]="timelineEvents()" />
            </div>
          </div>
        </ng-template>
      </li>
      <li [ngbNavItem]="'timeline'">
        <button ngbNavLink>{{ 'TABS.TIMELINE' | translate }}</button>
        <ng-template ngbNavContent>
          <div class="card">
            <div class="card-body">
              <app-operation-timeline [operationId]="operationId()" />
            </div>
          </div>
        </ng-template>
      </li>
    </ul>
    <div [ngbNavOutlet]="subNav"></div>
  `
})
export class OperationStatusComponent implements OnInit {
  operationId = input.required<number>();
  currentStatus = input.required<string>();
  completeness = input<CompletenessResponse | null>(null);
  documents = input<{status: string}[]>([]);
  statusChanged = output<void>();

  private operationService = inject(OperationService);
  private complianceService = inject(ComplianceService);
  private translate = inject(TranslateService);
  private toastService = inject(ToastService);
  authService = inject(AuthService);
  timelineEvents = signal<TimelineEvent[]>([]);
  validationErrors = signal<ValidationError[]>([]);
  isValidating = signal(false);
  selectedStatus = '';
  comment = '';
  availableStatuses = signal<string[]>([]);
  activeSubTab = 'status-history';

  ngOnInit(): void {
    this.loadHistory();
    this.operationService.getAllowedTransitions(this.operationId()).subscribe(
      statuses => this.availableStatuses.set(statuses)
    );
  }

  loadHistory(): void {
    this.operationService.getHistory(this.operationId()).subscribe(h => {
      this.timelineEvents.set(h.map(item => ({
        title: this.translateStatus(item.previousStatus ?? 'NEW') + ' → ' + this.translateStatus(item.newStatus),
        description: item.comment ?? '',
        date: item.changedAt,
        user: item.changedByUsername
      })));
    });
  }

  onChangeStatus(): void {
    if (!this.selectedStatus) return;
    this.validationErrors.set([]);
    this.isValidating.set(true);

    this.complianceService.validate(this.operationId(), this.selectedStatus).subscribe({
      next: (result) => {
        this.isValidating.set(false);
        if (!result.passed) {
          this.validationErrors.set(result.errors);
          return;
        }
        this.executeStatusChange();
      },
      error: () => {
        this.isValidating.set(false);
        this.executeStatusChange();
      }
    });
  }

  private executeStatusChange(): void {
    this.operationService.changeStatus(this.operationId(), {
      newStatus: this.selectedStatus as OperationStatus,
      comment: this.comment || undefined
    }).subscribe({
      next: () => {
        this.selectedStatus = ''; this.comment = ''; this.validationErrors.set([]); this.loadHistory(); this.statusChanged.emit();
        this.operationService.getAllowedTransitions(this.operationId()).subscribe(
          statuses => this.availableStatuses.set(statuses)
        );
      },
      error: (err) => {
        const msg = err.error?.error ?? '';
        const match = msg.match(/Invalid status transition from (\w+) to (\w+)/);
        if (match) {
          const from = this.translate.instant('STATUS.' + match[1]);
          const to = this.translate.instant('STATUS.' + match[2]);
          this.toastService.error(this.translate.instant('STATUS_CHANGE.INVALID_TRANSITION', { from, to }));
        } else {
          this.toastService.error(msg || this.translate.instant('STATUS_CHANGE.FAILED'));
        }
      }
    });
  }

  translateError(err: ValidationError): string {
    const key = 'COMPLIANCE.' + err.ruleCode;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : err.message;
  }

  private translateStatus(status: string): string {
    const key = 'STATUS.' + status;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : status;
  }
}
