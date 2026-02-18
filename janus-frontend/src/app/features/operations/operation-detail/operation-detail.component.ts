import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OperationService } from '../../../core/services/operation.service';
import { ComplianceService } from '../../../core/services/compliance.service';
import { AuditService } from '../../../core/services/audit.service';
import { Operation, OperationStatus } from '../../../core/models/operation.model';
import { CompletenessResponse, Document } from '../../../core/models/document.model';
import { AuditLog } from '../../../core/models/audit.model';
import { DocumentService } from '../../../core/services/document.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';
import { CompletenessIndicatorComponent } from '../../../shared/components/completeness-indicator/completeness-indicator.component';
import { OperationStatusComponent } from '../operation-status/operation-status.component';
import { DocumentListComponent } from '../../documents/document-list/document-list.component';
import { AuthService } from '../../../core/services/auth.service';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';
import { OperationTimelineComponent } from '../operation-timeline/operation-timeline.component';
import { OperationCommentsComponent } from '../operation-comments/operation-comments.component';
import { DeclarationListComponent } from '../../declarations/declaration-list/declaration-list.component';
import { CrossingResultComponent } from '../../declarations/crossing-result/crossing-result.component';
import { OperationAlertsComponent } from '../../alerts/operation-alerts/operation-alerts.component';

@Component({
  selector: 'app-operation-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, NgbNavModule, TranslateModule,
    StatusBadgeComponent, ProgressBarComponent, CompletenessIndicatorComponent,
    OperationStatusComponent, DocumentListComponent, StatusLabelPipe,
    OperationTimelineComponent, OperationCommentsComponent,
    DeclarationListComponent, CrossingResultComponent, OperationAlertsComponent
  ],
  template: `
    @if (operation()) {
      <app-operation-alerts [operationId]="operation()!.id" />
      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
        <div>
          <h2 class="mb-0 fs-4 fs-md-2">{{ operation()!.referenceNumber }}</h2>
          <small class="text-muted">{{ operation()!.clientName }}</small>
        </div>
        <div class="d-flex gap-2 align-items-center flex-wrap">
          <app-status-badge [status]="operation()!.status" />
          @if (authService.hasRole(['ADMIN', 'AGENT'])) {
            <a [routerLink]="['/operations', operation()!.id, 'edit']" class="btn btn-sm btn-outline-primary">{{ 'ACTIONS.EDIT' | translate }}</a>
          }
          @if (authService.hasRole(['ADMIN']) && operation()!.status === 'DRAFT') {
            <button class="btn btn-sm btn-outline-danger" (click)="confirmDelete()">{{ 'ACTIONS.DELETE' | translate }}</button>
          }
        </div>
      </div>

      <app-progress-bar [status]="operation()!.status" [interactive]="authService.hasRole(['ADMIN', 'AGENT'])" (stepClicked)="onProgressStepClick($event)" class="mb-4 d-block" />
      @if (statusChangeErrors().length > 0) {
        <div class="alert alert-danger alert-dismissible mb-3">
          <button type="button" class="btn-close" (click)="statusChangeErrors.set([])"></button>
          <strong>{{ 'COMPLIANCE.FAILED' | translate }}</strong>
          <ul class="mb-0 mt-1">
            @for (err of statusChangeErrors(); track err) {
              <li [innerHTML]="err"></li>
            }
          </ul>
        </div>
      }

      <ul ngbNav #nav="ngbNav" class="nav-tabs" [(activeId)]="activeTab">
        <li [ngbNavItem]="'info'">
          <button ngbNavLink>{{ 'TABS.INFO' | translate }}</button>
          <ng-template ngbNavContent>
            <div class="card mt-3">
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6">
                    <dl>
                      <dt>{{ 'OPERATIONS.CARGO_TYPE' | translate }}</dt><dd>{{ operation()!.cargoType | statusLabel }}</dd>
                      <dt>{{ 'OPERATIONS.INSPECTION_TYPE' | translate }}</dt><dd>{{ operation()!.inspectionType | statusLabel }}</dd>
                      <dt>{{ 'OPERATIONS.ASSIGNED_AGENT' | translate }}</dt><dd>{{ operation()!.assignedAgentName ?? ('OPERATIONS.NOT_ASSIGNED' | translate) }}</dd>
                    </dl>
                  </div>
                  <div class="col-md-6">
                    <dl>
                      <dt>{{ 'OPERATIONS.CREATED' | translate }}</dt><dd>{{ operation()!.createdAt | date:'medium' }}</dd>
                      <dt>{{ 'OPERATIONS.LAST_UPDATED' | translate }}</dt><dd>{{ operation()!.updatedAt | date:'medium' }}</dd>
                      @if (operation()!.deadline) {
                        <dt>{{ 'OPERATIONS.DEADLINE' | translate }}</dt><dd>{{ operation()!.deadline | date:'medium' }}</dd>
                      }
                    </dl>
                  </div>
                </div>
                @if (operation()!.notes) { <p class="mt-2"><strong>{{ 'OPERATIONS.NOTES' | translate }}:</strong> {{ operation()!.notes }}</p> }
              </div>
            </div>
          </ng-template>
        </li>
        @if (!authService.hasRole(['CARRIER'])) {
          <li [ngbNavItem]="'documents'">
            <button ngbNavLink>{{ 'TABS.DOCUMENTS' | translate }}</button>
            <ng-template ngbNavContent>
              @if (completeness()) {
                <div class="card mt-3">
                  <div class="card-body">
                    <app-completeness-indicator [percentage]="completeness()!.percentage" [missing]="completeness()!.missingDocuments" [color]="completeness()!.color" />
                  </div>
                </div>
              }
              <div class="mt-3"><app-document-list [operationId]="operation()!.id" /></div>
            </ng-template>
          </li>
        }
        <li [ngbNavItem]="'timeline'">
          <button ngbNavLink>{{ 'TABS.TIMELINE' | translate }}</button>
          <ng-template ngbNavContent>
            <div class="mt-3"><app-operation-timeline [operationId]="operation()!.id" /></div>
          </ng-template>
        </li>
        <li [ngbNavItem]="'comments'">
          <button ngbNavLink>{{ 'TABS.COMMENTS' | translate }}</button>
          <ng-template ngbNavContent>
            <div class="mt-3"><app-operation-comments [operationId]="operation()!.id" /></div>
          </ng-template>
        </li>
        @if (authService.hasRole(['ADMIN', 'AGENT', 'ACCOUNTING'])) {
          <li [ngbNavItem]="'declarations'">
            <button ngbNavLink>{{ 'TABS.DECLARATIONS' | translate }}</button>
            <ng-template ngbNavContent>
              <div class="mt-3">
                <app-declaration-list [operationId]="operation()!.id" />
                <app-crossing-result [operationId]="operation()!.id" />
              </div>
            </ng-template>
          </li>
        }
        <li [ngbNavItem]="'history'">
          <button ngbNavLink>{{ 'TABS.HISTORY' | translate }}</button>
          <ng-template ngbNavContent>
            <div class="mt-3">
              <app-operation-status [operationId]="operation()!.id" [currentStatus]="operation()!.status" [completeness]="completeness()" [documents]="documents()" (statusChanged)="reload()" />
            </div>
          </ng-template>
        </li>
        <li [ngbNavItem]="'audit'">
          <button ngbNavLink>{{ 'TABS.AUDIT' | translate }}</button>
          <ng-template ngbNavContent>
            <div class="card mt-3">
              <div class="card-body p-0 table-responsive">
                <table class="table table-sm mb-0">
                  <thead class="table-light"><tr><th>{{ 'AUDIT.ACTION' | translate }}</th><th>{{ 'AUDIT.USER' | translate }}</th><th class="d-none d-sm-table-cell">{{ 'AUDIT.ENTITY' | translate }}</th><th class="d-none d-md-table-cell">{{ 'AUDIT.IP' | translate }}</th><th class="d-none d-sm-table-cell">{{ 'AUDIT.DETAILS' | translate }}</th><th>{{ 'AUDIT.DATE' | translate }}</th></tr></thead>
                  <tbody>
                    @for (log of auditLogs(); track log.id) {
                      <tr>
                        <td><app-status-badge [status]="log.action" /></td>
                        <td>{{ log.username }}</td>
                        <td class="d-none d-sm-table-cell">
                          @if (log.entityName === 'Document' && log.entityId) {
                            <a [routerLink]="['/operations', operation()!.id, 'documents', log.entityId, 'versions']">{{ log.entityName }} #{{ log.entityId }}</a>
                          } @else {
                            {{ log.entityName }}
                          }
                        </td>
                        <td class="d-none d-md-table-cell"><small class="text-muted">{{ log.ipAddress ?? '-' }}</small></td>
                        <td class="d-none d-sm-table-cell"><small>{{ log.details }}</small></td>
                        <td>{{ log.createdAt | date:'medium' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </ng-template>
        </li>
      </ul>
      <div [ngbNavOutlet]="nav"></div>
    }
  `
})
export class OperationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private operationService = inject(OperationService);
  private complianceService = inject(ComplianceService);
  private auditService = inject(AuditService);
  private documentService = inject(DocumentService);
  private translate = inject(TranslateService);
  authService = inject(AuthService);

  operation = signal<Operation | null>(null);
  auditLogs = signal<AuditLog[]>([]);
  completeness = signal<CompletenessResponse | null>(null);
  documents = signal<Document[]>([]);
  statusChangeErrors = signal<string[]>([]);
  activeTab = 'info';

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab) { this.activeTab = tab; }
    this.reload();
  }

  reload(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.operationService.getById(id).subscribe(op => this.operation.set(op));
    this.operationService.getCompleteness(id).subscribe(c => this.completeness.set(c));
    this.auditService.getByOperation(id).subscribe(logs => this.auditLogs.set(logs));
    this.documentService.getByOperation(id).subscribe(docs => this.documents.set(docs));
  }

  onProgressStepClick(newStatus: string): void {
    const msg = this.translate.instant('COMMON.ARE_YOU_SURE');
    if (!confirm(msg)) return;

    this.statusChangeErrors.set([]);
    this.complianceService.validate(this.operation()!.id, newStatus).subscribe({
      next: (result) => {
        if (!result.passed) {
          this.statusChangeErrors.set(result.errors.map(e => {
            const key = 'COMPLIANCE.' + e.ruleCode;
            const translated = this.translate.instant(key);
            return translated !== key ? translated : e.message;
          }));
          return;
        }
        this.executeProgressStatusChange(newStatus);
      },
      error: () => this.executeProgressStatusChange(newStatus)
    });
  }

  private executeProgressStatusChange(newStatus: string): void {
    this.operationService.changeStatus(this.operation()!.id, {
      newStatus: newStatus as OperationStatus
    }).subscribe({
      next: () => this.reload(),
      error: (err) => {
        const msg = err.error?.error ?? '';
        const match = msg.match(/Invalid status transition from (\w+) to (\w+)/);
        if (match) {
          const from = this.translate.instant('STATUS.' + match[1]);
          const to = this.translate.instant('STATUS.' + match[2]);
          this.statusChangeErrors.set([this.translate.instant('STATUS_CHANGE.INVALID_TRANSITION', { from, to })]);
        } else {
          this.statusChangeErrors.set([msg || this.translate.instant('STATUS_CHANGE.FAILED')]);
        }
      }
    });
  }

  confirmDelete(): void {
    const msg = this.translate.instant('COMMON.ARE_YOU_SURE');
    if (confirm(msg)) {
      this.operationService.delete(this.operation()!.id).subscribe(() => {
        this.router.navigate(['/operations']);
      });
    }
  }
}
