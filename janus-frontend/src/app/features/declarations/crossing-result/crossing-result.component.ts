import { Component, input, inject, OnInit, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DeclarationService } from '../../../core/services/declaration.service';
import { CrossingResult, CrossingStatus } from '../../../core/models/declaration.model';
import { AuthService } from '../../../core/services/auth.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingIndicatorComponent } from '../../../shared/components/loading-indicator/loading-indicator.component';

@Component({
  selector: 'app-crossing-result',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, StatusBadgeComponent, LoadingIndicatorComponent],
  template: `
    <div class="card mt-3">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0">{{ 'CROSSING.TITLE' | translate }}</h6>
        @if (authService.hasRole(['ADMIN', 'SUPERVISOR', 'AGENT']) && !crossing() && !loading()) {
          <button class="btn btn-sm btn-primary" (click)="executeCrossing()">{{ 'CROSSING.EXECUTE' | translate }}</button>
        }
      </div>
      <div class="card-body">
        @if (loading()) {
          <app-loading-indicator size="sm" />
        } @else if (crossing()) {
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
                    <td>{{ 'DECLARATIONS.' + d.field | translate }}</td>
                    <td>{{ d.tariffLineNumber ?? '-' }}</td>
                    <td>{{ d.preliminaryValue }}</td>
                    <td>{{ d.finalValue }}</td>
                    <td>{{ d.difference | number:'1.2-2' }}</td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="fw-bold table-dark">
                  <td>{{ 'CROSSING.TOTAL' | translate }}</td>
                  <td></td>
                  <td>{{ discrepancyTotals().preliminary | number:'1.2-2' }}</td>
                  <td>{{ discrepancyTotals().final | number:'1.2-2' }}</td>
                  <td>{{ discrepancyTotals().difference | number:'1.2-2' }}</td>
                </tr>
              </tfoot>
            </table>
          }
          @if (crossing()!.status === 'DISCREPANCY' && authService.hasRole(['ADMIN', 'SUPERVISOR', 'AGENT'])) {
            <div class="mt-3">
              <textarea class="form-control mb-2" rows="3" [placeholder]="'CROSSING.RESOLVE_PLACEHOLDER' | translate" [(ngModel)]="resolveComment"></textarea>
              <button class="btn btn-warning" (click)="resolveCrossing()" [disabled]="!resolveComment.trim()">{{ 'CROSSING.RESOLVE' | translate }}</button>
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
  loading = signal(true);
  resolved = output<CrossingResult>();
  resolveComment = '';
  discrepancyTotals = computed(() => {
    const discrepancies = this.crossing()?.discrepancies ?? [];
    return {
      preliminary: discrepancies.reduce((sum, d) => sum + parseFloat(d.preliminaryValue || '0'), 0),
      final: discrepancies.reduce((sum, d) => sum + parseFloat(d.finalValue || '0'), 0),
      difference: discrepancies.reduce((sum, d) => sum + (d.difference ?? 0), 0)
    };
  });

  ngOnInit(): void { this.loadCrossing(); }

  loadCrossing(): void {
    this.declarationService.getCrossing(this.operationId()).subscribe({
      next: (c) => {
        this.crossing.set(c);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  executeCrossing(): void {
    this.declarationService.executeCrossing(this.operationId()).subscribe(c => {
      this.crossing.set(c);
      this.resolved.emit(c);
    });
  }

  resolveCrossing(): void {
    if (!this.resolveComment.trim()) return;
    this.declarationService.resolveCrossing(this.operationId(), { comment: this.resolveComment }).subscribe(c => {
      this.crossing.set(c);
      this.resolveComment = '';
      this.resolved.emit(c);
    });
  }
}
