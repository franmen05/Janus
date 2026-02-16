import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OperationService } from '../../../core/services/operation.service';
import { Operation, OperationStatus } from '../../../core/models/operation.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-operation-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatusBadgeComponent],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Operations</h2>
      @if (authService.hasRole(['ADMIN', 'AGENT'])) {
        <a routerLink="/operations/new" class="btn btn-primary">New Operation</a>
      }
    </div>
    <div class="card mb-3">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <select class="form-select" [(ngModel)]="filterStatus" (ngModelChange)="loadOperations()">
              <option value="">All Statuses</option>
              @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
            </select>
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-body p-0">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr><th>Reference</th><th>Client</th><th>Cargo</th><th>Inspection</th><th>Status</th><th>Agent</th><th>Created</th></tr>
          </thead>
          <tbody>
            @for (op of operations(); track op.id) {
              <tr [routerLink]="['/operations', op.id]" style="cursor: pointer;">
                <td class="fw-bold">{{ op.referenceNumber }}</td>
                <td>{{ op.clientName }}</td>
                <td>{{ op.cargoType }}</td>
                <td>{{ op.inspectionType }}</td>
                <td><app-status-badge [status]="op.status" /></td>
                <td>{{ op.assignedAgentName ?? '-' }}</td>
                <td>{{ op.createdAt | date:'shortDate' }}</td>
              </tr>
            }
            @if (operations().length === 0) {
              <tr><td colspan="7" class="text-center text-muted py-4">No operations found</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class OperationListComponent implements OnInit {
  private operationService = inject(OperationService);
  authService = inject(AuthService);
  operations = signal<Operation[]>([]);
  filterStatus = '';
  statuses = Object.values(OperationStatus);

  ngOnInit(): void { this.loadOperations(); }

  loadOperations(): void {
    this.operationService.getAll(this.filterStatus || undefined).subscribe(ops => this.operations.set(ops));
  }
}
