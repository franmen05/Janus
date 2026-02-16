import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { OperationService } from '../../../core/services/operation.service';
import { AuditService } from '../../../core/services/audit.service';
import { Operation } from '../../../core/models/operation.model';
import { CompletenessResponse } from '../../../core/models/document.model';
import { AuditLog } from '../../../core/models/audit.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';
import { CompletenessIndicatorComponent } from '../../../shared/components/completeness-indicator/completeness-indicator.component';
import { OperationStatusComponent } from '../operation-status/operation-status.component';
import { DocumentListComponent } from '../../documents/document-list/document-list.component';
import { AuthService } from '../../../core/services/auth.service';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';

@Component({
  selector: 'app-operation-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, NgbNavModule,
    StatusBadgeComponent, ProgressBarComponent, CompletenessIndicatorComponent,
    OperationStatusComponent, DocumentListComponent, StatusLabelPipe
  ],
  template: `
    @if (operation()) {
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 class="mb-0">{{ operation()!.referenceNumber }}</h2>
          <small class="text-muted">{{ operation()!.clientName }}</small>
        </div>
        <div class="d-flex gap-2 align-items-center">
          <app-status-badge [status]="operation()!.status" />
          @if (authService.hasRole(['ADMIN', 'AGENT'])) {
            <a [routerLink]="['/operations', operation()!.id, 'edit']" class="btn btn-sm btn-outline-primary">Edit</a>
          }
        </div>
      </div>

      <app-progress-bar [status]="operation()!.status" class="mb-4 d-block" />

      <ul ngbNav #nav="ngbNav" class="nav-tabs" [(activeId)]="activeTab">
        <li [ngbNavItem]="'info'">
          <button ngbNavLink>Info</button>
          <ng-template ngbNavContent>
            <div class="card mt-3">
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6">
                    <dl>
                      <dt>Cargo Type</dt><dd>{{ operation()!.cargoType | statusLabel }}</dd>
                      <dt>Inspection Type</dt><dd>{{ operation()!.inspectionType | statusLabel }}</dd>
                      <dt>Assigned Agent</dt><dd>{{ operation()!.assignedAgentName ?? 'Not assigned' }}</dd>
                    </dl>
                  </div>
                  <div class="col-md-6">
                    <dl>
                      <dt>Created</dt><dd>{{ operation()!.createdAt | date:'medium' }}</dd>
                      <dt>Last Updated</dt><dd>{{ operation()!.updatedAt | date:'medium' }}</dd>
                    </dl>
                  </div>
                </div>
                @if (operation()!.notes) { <p class="mt-2"><strong>Notes:</strong> {{ operation()!.notes }}</p> }
              </div>
            </div>
            @if (completeness()) {
              <div class="card mt-3">
                <div class="card-body">
                  <app-completeness-indicator [percentage]="completeness()!.percentage" [missing]="completeness()!.missingDocuments" [color]="completeness()!.color" />
                </div>
              </div>
            }
          </ng-template>
        </li>
        <li [ngbNavItem]="'documents'">
          <button ngbNavLink>Documents</button>
          <ng-template ngbNavContent>
            <div class="mt-3"><app-document-list [operationId]="operation()!.id" /></div>
          </ng-template>
        </li>
        <li [ngbNavItem]="'history'">
          <button ngbNavLink>History</button>
          <ng-template ngbNavContent>
            <div class="mt-3">
              <app-operation-status [operationId]="operation()!.id" [currentStatus]="operation()!.status" (statusChanged)="reload()" />
            </div>
          </ng-template>
        </li>
        <li [ngbNavItem]="'audit'">
          <button ngbNavLink>Audit</button>
          <ng-template ngbNavContent>
            <div class="card mt-3">
              <div class="card-body p-0">
                <table class="table table-sm mb-0">
                  <thead class="table-light"><tr><th>Action</th><th>User</th><th>Details</th><th>Date</th></tr></thead>
                  <tbody>
                    @for (log of auditLogs(); track log.id) {
                      <tr>
                        <td><app-status-badge [status]="log.action" /></td>
                        <td>{{ log.username }}</td>
                        <td><small>{{ log.details }}</small></td>
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
  private operationService = inject(OperationService);
  private auditService = inject(AuditService);
  authService = inject(AuthService);

  operation = signal<Operation | null>(null);
  auditLogs = signal<AuditLog[]>([]);
  completeness = signal<CompletenessResponse | null>(null);
  activeTab = 'info';

  ngOnInit(): void { this.reload(); }

  reload(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.operationService.getById(id).subscribe(op => this.operation.set(op));
    this.operationService.getCompleteness(id).subscribe(c => this.completeness.set(c));
    this.auditService.getByOperation(id).subscribe(logs => this.auditLogs.set(logs));
  }
}
