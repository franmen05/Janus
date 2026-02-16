import { Component, input, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DeclarationService } from '../../../core/services/declaration.service';
import { CrossingResult, CrossingStatus } from '../../../core/models/declaration.model';
import { AuthService } from '../../../core/services/auth.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-crossing-result',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, StatusBadgeComponent],
  template: `
    <div class="card mt-3">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0">{{ 'CROSSING.TITLE' | translate }}</h6>
        @if (authService.hasRole(['ADMIN', 'AGENT']) && !crossing()) {
          <button class="btn btn-sm btn-primary" (click)="executeCrossing()">{{ 'CROSSING.EXECUTE' | translate }}</button>
        }
      </div>
      <div class="card-body">
        @if (crossing()) {
          <div class="mb-2">
            <strong>{{ 'CROSSING.STATUS' | translate }}:</strong>
            <app-status-badge [status]="crossing()!.status" />
          </div>
          @if (crossing()!.resolvedBy) {
            <p class="text-muted mb-1"><strong>{{ 'CROSSING.RESOLVED_BY' | translate }}:</strong> {{ crossing()!.resolvedBy }} ({{ crossing()!.resolvedAt | date:'medium' }})</p>
            <p class="text-muted mb-2"><strong>{{ 'CROSSING.RESOLUTION_COMMENT' | translate }}:</strong> {{ crossing()!.resolutionComment }}</p>
          }
          @if (crossing()!.discrepancies.length > 0) {
            <h6 class="mt-3">{{ 'CROSSING.DISCREPANCIES' | translate }}</h6>
            <table class="table table-sm">
              <thead class="table-light">
                <tr>
                  <th>{{ 'CROSSING.FIELD' | translate }}</th>
                  <th>{{ 'CROSSING.TARIFF_LINE' | translate }}</th>
                  <th>{{ 'CROSSING.PRELIMINARY_VALUE' | translate }}</th>
                  <th>{{ 'CROSSING.FINAL_VALUE' | translate }}</th>
                  <th>{{ 'CROSSING.DIFFERENCE' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (d of crossing()!.discrepancies; track d.id) {
                  <tr>
                    <td>{{ d.field }}</td>
                    <td>{{ d.tariffLineNumber ?? '-' }}</td>
                    <td>{{ d.preliminaryValue }}</td>
                    <td>{{ d.finalValue }}</td>
                    <td>{{ d.difference | number:'1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
          @if (crossing()!.status === 'DISCREPANCY' && authService.hasRole(['ADMIN', 'AGENT'])) {
            <div class="mt-3">
              <div class="input-group">
                <input type="text" class="form-control" [placeholder]="'CROSSING.RESOLVE_PLACEHOLDER' | translate" [(ngModel)]="resolveComment">
                <button class="btn btn-warning" (click)="resolveCrossing()" [disabled]="!resolveComment.trim()">{{ 'CROSSING.RESOLVE' | translate }}</button>
              </div>
            </div>
          }
        } @else {
          <p class="text-muted mb-0">{{ 'CROSSING.NO_CROSSING' | translate }}</p>
        }
      </div>
    </div>
  `
})
export class CrossingResultComponent implements OnInit {
  operationId = input.required<number>();

  private declarationService = inject(DeclarationService);
  authService = inject(AuthService);
  crossing = signal<CrossingResult | null>(null);
  resolveComment = '';

  ngOnInit(): void { this.loadCrossing(); }

  loadCrossing(): void {
    this.declarationService.getCrossing(this.operationId()).subscribe(c => this.crossing.set(c));
  }

  executeCrossing(): void {
    this.declarationService.executeCrossing(this.operationId()).subscribe(c => this.crossing.set(c));
  }

  resolveCrossing(): void {
    if (!this.resolveComment.trim()) return;
    this.declarationService.resolveCrossing(this.operationId(), { comment: this.resolveComment }).subscribe(c => {
      this.crossing.set(c);
      this.resolveComment = '';
    });
  }
}
