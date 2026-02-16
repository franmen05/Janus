import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { OperationService } from '../../core/services/operation.service';
import { Operation, OperationStatus } from '../../core/models/operation.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, StatusBadgeComponent],
  template: `
    <h2 class="mb-4">{{ 'DASHBOARD.TITLE' | translate }}</h2>
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card card-dashboard border-primary">
          <div class="card-body">
            <h5 class="card-title text-primary">{{ 'DASHBOARD.ACTIVE' | translate }}</h5>
            <h2 class="mb-0">{{ activeCount() }}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card card-dashboard border-warning">
          <div class="card-body">
            <h5 class="card-title text-warning">{{ 'DASHBOARD.DRAFT' | translate }}</h5>
            <h2 class="mb-0">{{ draftCount() }}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card card-dashboard border-success">
          <div class="card-body">
            <h5 class="card-title text-success">{{ 'DASHBOARD.CLOSED' | translate }}</h5>
            <h2 class="mb-0">{{ closedCount() }}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card card-dashboard border-danger">
          <div class="card-body">
            <h5 class="card-title text-danger">{{ 'DASHBOARD.CANCELLED' | translate }}</h5>
            <h2 class="mb-0">{{ cancelledCount() }}</h2>
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">{{ 'DASHBOARD.RECENT_OPERATIONS' | translate }}</h5>
        <a routerLink="/operations" class="btn btn-sm btn-outline-primary">{{ 'DASHBOARD.VIEW_ALL' | translate }}</a>
      </div>
      <div class="card-body p-0">
        <table class="table table-hover mb-0">
          <thead><tr><th>{{ 'OPERATIONS.REFERENCE' | translate }}</th><th>{{ 'OPERATIONS.CLIENT' | translate }}</th><th>{{ 'COMMON.STATUS' | translate }}</th><th>{{ 'OPERATIONS.CREATED' | translate }}</th></tr></thead>
          <tbody>
            @for (op of recentOperations(); track op.id) {
              <tr [routerLink]="['/operations', op.id]" style="cursor: pointer;">
                <td>{{ op.referenceNumber }}</td>
                <td>{{ op.clientName }}</td>
                <td><app-status-badge [status]="op.status" /></td>
                <td>{{ op.createdAt | date:'shortDate' }}</td>
              </tr>
            }
            @if (recentOperations().length === 0) {
              <tr><td colspan="4" class="text-center text-muted py-3">{{ 'DASHBOARD.NO_OPERATIONS' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private operationService = inject(OperationService);
  recentOperations = signal<Operation[]>([]);
  activeCount = signal(0);
  draftCount = signal(0);
  closedCount = signal(0);
  cancelledCount = signal(0);

  ngOnInit(): void {
    this.operationService.getAll().subscribe(ops => {
      this.recentOperations.set(ops.slice(0, 10));
      this.activeCount.set(ops.filter(o => o.status !== OperationStatus.CLOSED && o.status !== OperationStatus.CANCELLED && o.status !== OperationStatus.DRAFT).length);
      this.draftCount.set(ops.filter(o => o.status === OperationStatus.DRAFT).length);
      this.closedCount.set(ops.filter(o => o.status === OperationStatus.CLOSED).length);
      this.cancelledCount.set(ops.filter(o => o.status === OperationStatus.CANCELLED).length);
    });
  }
}
