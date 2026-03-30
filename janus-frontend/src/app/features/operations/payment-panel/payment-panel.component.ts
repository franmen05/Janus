import { Component, input, output, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PaymentService } from '../../../core/services/payment.service';
import { InspectionService } from '../../../core/services/inspection.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../core/models/client.model';
import { Operation } from '../../../core/models/operation.model';
import { Liquidation, Payment, RegisterPaymentRequest } from '../../../core/models/payment.model';
import { ChargeCrossReference } from '../../../core/models/inspection.model';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ChargesTableComponent } from '../../../shared/components/charges-table/charges-table.component';
import { LoadingIndicatorComponent } from '../../../shared/components/loading-indicator/loading-indicator.component';

@Component({
  selector: 'app-payment-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, NgbTooltipModule, ChargesTableComponent, LoadingIndicatorComponent],
  template: `
    @if (loading()) {
      <app-loading-indicator size="sm" />
    } @else {
    <!-- Charges Table -->
    <app-charges-table class="mb-3 d-block"
      [operationId]="operationId()"
      [operation]="operation()"
      [operationSummary]="operationSummary()"
      [clients]="clients()"
      (changed)="onChargesChanged()" />

    <!-- Liquidation & Payment Card -->
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0"><i class="bi bi-cash-stack me-2"></i>{{ 'PAYMENT.TITLE' | translate }}</h6>
        @if (liquidation()) {
          <span class="badge" [ngClass]="getStatusBadgeClass(liquidation()!.status)">
            {{ 'PAYMENT.STATUS_' + liquidation()!.status | translate }}
          </span>
        }
      </div>

      <!-- ═══ Summary Metrics ═══ -->
      @if (crossReference() && (crossReference()!.totalIncome > 0 || crossReference()!.totalExpenses > 0)) {
        <div class="px-3 pt-3">
          <div class="row g-2 mb-0">
            <div class="col-6 col-md-3">
              <div class="rounded-3 p-2 text-center" style="background: var(--bs-body-bg); border: 1px solid var(--bs-border-color)">
                <div class="text-muted small" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em">{{ 'PAYMENT.TOTAL_INCOME' | translate }}</div>
                <div class="fw-bold text-success">{{ crossReference()!.totalIncome | number:'1.2-2' }}</div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="rounded-3 p-2 text-center" style="background: var(--bs-body-bg); border: 1px solid var(--bs-border-color)">
                <div class="text-muted small" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em">{{ 'PAYMENT.TOTAL_EXPENSES' | translate }}</div>
                <div class="fw-bold text-danger">{{ crossReference()!.totalExpenses | number:'1.2-2' }}</div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="rounded-3 p-2 text-center" style="background: var(--bs-body-bg); border: 1px solid var(--bs-border-color)">
                <div class="text-muted small" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em">{{ 'PAYMENT.BALANCE' | translate }}</div>
                <div class="fw-bold" [ngClass]="{
                  'text-success': crossReference()!.balance > 0,
                  'text-danger': crossReference()!.balance < 0,
                  'text-muted': crossReference()!.balance === 0
                }">{{ crossReference()!.balance | number:'1.2-2' }}</div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="rounded-3 p-2 text-center" [style.background]="getProfitBg()" [style.border]="'1px solid ' + getProfitBorderColor()">
                <div class="small" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em" [style.color]="getProfitColor()">{{ 'PAYMENT.PROFIT_PERCENT' | translate }}</div>
                <div class="fw-bold fs-6" [style.color]="getProfitColor()">{{ profitPercent() | number:'1.1-1' }}%</div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ═══ Cross-Reference Section ═══ -->
      @if (crossReference()) {
        @if (crossReference()!.totalIncome === 0 && crossReference()!.totalExpenses === 0) {
          <div class="px-3 pt-3 pb-2">
            <p class="text-muted text-center mb-0">{{ 'PAYMENT.NO_CHARGES' | translate }}</p>
          </div>
        } @else {
          <div class="px-3 pt-3 pb-2">
            <div class="d-flex align-items-center mb-3">
              <span class="text-uppercase small fw-semibold text-primary" style="letter-spacing: 0.05em">
                <i class="bi bi-arrow-left-right me-1"></i>{{ 'PAYMENT.CROSS_REFERENCE_TITLE' | translate }}
              </span>
              <i class="bi bi-info-circle text-muted ms-2"
                 style="cursor:pointer"
                 [ngbTooltip]="'PAYMENT.CROSS_REFERENCE_INFO' | translate"
                 triggers="click:blur"
                 placement="top"></i>
            </div>
            <div class="table-responsive">
              <table class="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th class="border-0 text-muted small fw-semibold pb-2">{{ 'PAYMENT.CATEGORY' | translate }}</th>
                    <th class="border-0 text-muted small fw-semibold pb-2 d-none d-sm-table-cell">{{ 'PAYMENT.DESCRIPTION' | translate }}</th>
                    <th class="border-0 text-end small fw-semibold pb-2" style="color: var(--bs-success)">{{ 'PAYMENT.INCOME' | translate }}</th>
                    <th class="border-0 text-end small fw-semibold pb-2" style="color: var(--bs-danger)">{{ 'PAYMENT.EXPENSES' | translate }}</th>
                    <th class="border-0 text-center text-muted small fw-semibold pb-2">{{ 'PAYMENT.REIMBURSABLE' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (cat of allCategories(); track cat) {
                    <tr>
                      <td class="border-0 py-1">{{ 'INSPECTION.CATEGORY_' + cat | translate }}</td>
                      <td class="border-0 py-1 text-muted small d-none d-sm-table-cell">
                        @for (desc of getDescriptionsForCategory(cat); track $index) {
                          {{ desc }}@if (!$last) {, }
                        }
                        @if (getDescriptionsForCategory(cat).length === 0) {
                          &mdash;
                        }
                      </td>
                      <td class="border-0 py-1 text-end">
                        @if (getIncomeForCategory(cat) !== null) {
                          <span class="text-success fw-medium">{{ getIncomeForCategory(cat)! | number:'1.2-2' }}</span>
                        } @else {
                          <span class="text-muted">&mdash;</span>
                        }
                      </td>
                      <td class="border-0 py-1 text-end">
                        @if (getExpenseForCategory(cat) !== null) {
                          <span class="text-danger fw-medium">{{ getExpenseForCategory(cat)! | number:'1.2-2' }}</span>
                        } @else {
                          <span class="text-muted">&mdash;</span>
                        }
                      </td>
                      <td class="border-0 py-1 text-center">
                        @if (isReimbursableCategory(cat)) {
                          <span class="badge" style="background: rgba(108,117,125,0.1); color: #6c757d; font-size: 0.75em; padding: 0.35em 0.65em; line-height: 1"><i class="bi bi-arrow-repeat me-1"></i>{{ 'PAYMENT.REIMBURSABLE' | translate }}</span>
                        } @else {
                          <span class="text-muted">&mdash;</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr>
                    <td class="fw-bold border-top pt-2">Total</td>
                    <td class="border-top d-none d-sm-table-cell"></td>
                    <td class="fw-bold border-top pt-2 text-end text-success">{{ crossReference()!.totalIncome | number:'1.2-2' }}</td>
                    <td class="fw-bold border-top pt-2 text-end text-danger">{{ crossReference()!.totalExpenses | number:'1.2-2' }}</td>
                    <td class="fw-bold border-top pt-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Send to billing -->
          @if (authService.hasRole(['ADMIN', 'AGENT'])) {
            <div class="px-3 pb-3">
              <div class="d-flex align-items-center justify-content-between">
                <span class="text-muted small">
                  @if (crossReference()!.allIncomeSentToBilling) {
                    <i class="bi bi-check-circle-fill text-success me-1"></i>{{ 'PAYMENT.ALL_SENT_TO_BILLING' | translate }}
                  } @else {
                    {{ 'PAYMENT.BILLING_PROGRESS' | translate:{ sent: crossReference()!.incomeSentToBillingCount, total: crossReference()!.totalIncomeCount } }}
                  }
                </span>
                <button class="btn btn-outline-primary btn-sm"
                        (click)="sendToBilling()"
                        [disabled]="crossReference()!.allIncomeSentToBilling || crossReference()!.totalIncomeCount === 0 || sendingToBilling()">
                  @if (sendingToBilling()) {
                    <span class="spinner-border spinner-border-sm me-1"></span>
                    {{ 'PAYMENT.SENDING_TO_BILLING' | translate }}
                  } @else {
                    <i class="bi bi-send me-1"></i>{{ 'PAYMENT.SEND_TO_BILLING' | translate }}
                  }
                </button>
              </div>
            </div>
          }
        }
        <hr class="my-0">
      }

      <!-- ═══ Liquidation Section ═══ -->
      <div class="px-3 py-3">
        <div class="d-flex align-items-center mb-3">
          <span class="text-uppercase small fw-semibold text-primary" style="letter-spacing: 0.05em">
            <i class="bi bi-receipt me-1"></i>{{ 'PAYMENT.LIQUIDATION_SECTION' | translate }}
          </span>
          <i class="bi bi-info-circle text-muted ms-2"
             style="cursor:pointer"
             [ngbTooltip]="'PAYMENT.LIQUIDATION_INFO' | translate"
             triggers="click:blur"
             placement="top"></i>
        </div>
        @if (!liquidation()) {
          <div class="text-center py-4">
            <p class="text-muted">{{ 'PAYMENT.NO_LIQUIDATION' | translate }}</p>
            @if (canEdit()) {
              <div class="row justify-content-center mb-3">
                <div class="col-md-4">
                  <label class="form-label">{{ 'PAYMENT.AGENCY_FEE' | translate }}</label>
                  <div class="input-group input-group-sm">
                    <span class="input-group-text">$</span>
                    <input type="number" class="form-control" [(ngModel)]="agencyFee"
                           [placeholder]="'PAYMENT.AGENCY_FEE_PLACEHOLDER' | translate" step="0.01">
                  </div>
                </div>
              </div>
              <button class="btn btn-primary" (click)="generate()" [disabled]="generating()">
                @if (generating()) {
                  <span class="spinner-border spinner-border-sm me-1"></span>
                }
                <i class="bi bi-calculator me-1"></i>{{ 'PAYMENT.GENERATE' | translate }}
              </button>
            }
          </div>
        }

        @if (liquidation()) {

          <!-- Approval info -->
          @if (liquidation()!.approvedBy) {
            <div class="alert alert-info py-2 mb-3">
              <small>
                <strong>{{ 'PAYMENT.APPROVED_BY' | translate }}:</strong> {{ liquidation()!.approvedBy }}
                <span class="ms-2"><strong>{{ 'PAYMENT.APPROVED_AT' | translate }}:</strong> {{ liquidation()!.approvedAt | date:'medium' }}</span>
                @if (liquidation()!.approvalComment) {
                  <div class="mt-1"><em>{{ liquidation()!.approvalComment }}</em></div>
                }
              </small>
            </div>
          }

          <!-- Actions section -->
          <div class="mt-3">
            @if (liquidation()!.status === 'PRELIMINARY' && canEdit()) {
              <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-success btn-sm" (click)="approve()" [disabled]="!authService.hasRole(['ADMIN'])">
                  <i class="bi bi-check-circle me-1"></i>{{ 'PAYMENT.APPROVE' | translate }}
                </button>
                <button class="btn btn-outline-secondary btn-sm" (click)="regenerate()" [disabled]="generating()">
                  @if (generating()) {
                    <span class="spinner-border spinner-border-sm me-1"></span>
                  }
                  <i class="bi bi-arrow-clockwise me-1"></i>{{ 'PAYMENT.REGENERATE' | translate }}
                </button>
              </div>
            }

            @if (liquidation()!.status === 'APPROVED' && canEdit()) {
              <button class="btn btn-primary btn-sm" (click)="makeDefinitive()" [disabled]="saving()">
                @if (saving()) {
                  <span class="spinner-border spinner-border-sm me-1"></span>
                }
                {{ 'PAYMENT.MAKE_DEFINITIVE' | translate }}
              </button>
            }

            @if (liquidation()!.status === 'DEFINITIVE' && canEdit()) {
              <div class="card border-success mt-2">
                <div class="card-body">
                  <h6>{{ 'PAYMENT.REGISTER_PAYMENT' | translate }}</h6>
                  <div class="row g-2">
                    <div class="col-md-4">
                      <label class="form-label">{{ 'PAYMENT.PAYMENT_AMOUNT' | translate }} <span class="text-danger">*</span></label>
                      <div class="input-group input-group-sm">
                        <span class="input-group-text">$</span>
                        <input type="number" class="form-control" [(ngModel)]="paymentAmount" step="0.01">
                      </div>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">{{ 'PAYMENT.PAYMENT_METHOD' | translate }} <span class="text-danger">*</span></label>
                      <select class="form-select form-select-sm" [(ngModel)]="paymentMethod">
                        <option value="">--</option>
                        <option value="BANK_TRANSFER">{{ 'PAYMENT.METHOD_BANK_TRANSFER' | translate }}</option>
                        <option value="CHECK">{{ 'PAYMENT.METHOD_CHECK' | translate }}</option>
                        <option value="CASH">{{ 'PAYMENT.METHOD_CASH' | translate }}</option>
                        <option value="ELECTRONIC">{{ 'PAYMENT.METHOD_ELECTRONIC' | translate }}</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">{{ 'PAYMENT.PAYMENT_DATE' | translate }} <span class="text-danger">*</span></label>
                      <input type="date" class="form-control form-control-sm" [(ngModel)]="paymentDate">
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">{{ 'PAYMENT.DGA_REFERENCE' | translate }}</label>
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="paymentDgaRef">
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">{{ 'PAYMENT.BANK_REFERENCE' | translate }}</label>
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="paymentBankRef">
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">{{ 'PAYMENT.NOTES' | translate }}</label>
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="paymentNotes">
                    </div>
                  </div>
                  <button class="btn btn-success btn-sm mt-2" (click)="registerPayment()"
                          [disabled]="!paymentAmount || !paymentMethod || !paymentDate || saving()">
                    @if (saving()) {
                      <span class="spinner-border spinner-border-sm me-1"></span>
                    }
                    <i class="bi bi-cash-coin me-1"></i>{{ 'PAYMENT.REGISTER_PAYMENT' | translate }}
                  </button>
                </div>
              </div>
            }

            @if (liquidation()!.status === 'PAID' && payment()) {
              <div class="card border-success mt-2">
                <div class="card-header bg-success bg-opacity-10">
                  <h6 class="mb-0"><i class="bi bi-check-circle-fill text-success me-2"></i>{{ 'PAYMENT.PAYMENT_DETAILS' | translate }}</h6>
                </div>
                <div class="card-body">
                  <div class="row">
                    <div class="col-md-6">
                      <dl>
                        <dt>{{ 'PAYMENT.PAYMENT_AMOUNT' | translate }}</dt>
                        <dd>{{ payment()!.amount | number:'1.2-2' }}</dd>
                        <dt>{{ 'PAYMENT.PAYMENT_METHOD' | translate }}</dt>
                        <dd>{{ 'PAYMENT.METHOD_' + payment()!.paymentMethod | translate }}</dd>
                        <dt>{{ 'PAYMENT.PAYMENT_DATE' | translate }}</dt>
                        <dd>{{ payment()!.paymentDate | date:'mediumDate' }}</dd>
                      </dl>
                    </div>
                    <div class="col-md-6">
                      <dl>
                        @if (payment()!.dgaReference) {
                          <dt>{{ 'PAYMENT.DGA_REFERENCE' | translate }}</dt>
                          <dd>{{ payment()!.dgaReference }}</dd>
                        }
                        @if (payment()!.bankReference) {
                          <dt>{{ 'PAYMENT.BANK_REFERENCE' | translate }}</dt>
                          <dd>{{ payment()!.bankReference }}</dd>
                        }
                        <dt>{{ 'PAYMENT.REGISTERED_BY' | translate }}</dt>
                        <dd>{{ payment()!.registeredBy }}</dd>
                        @if (payment()!.notes) {
                          <dt>{{ 'PAYMENT.NOTES' | translate }}</dt>
                          <dd>{{ payment()!.notes }}</dd>
                        }
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
    }
  `
})
export class PaymentPanelComponent implements OnInit {
  operationId = input.required<number>();
  operation = input<Operation | null>(null);
  changed = output<void>();

  private paymentService = inject(PaymentService);
  private inspectionService = inject(InspectionService);
  private translate = inject(TranslateService);
  private clientService = inject(ClientService);
  authService = inject(AuthService);

  // State
  loading = signal(true);
  liquidation = signal<Liquidation | null>(null);
  payment = signal<Payment | null>(null);
  crossReference = signal<ChargeCrossReference | null>(null);
  sendingToBilling = signal(false);
  generating = signal(false);
  saving = signal(false);
  clients = signal<Client[]>([]);

  operationSummary = computed(() => {
    const op = this.operation();
    if (!op) return null;
    return {
      pieces: op.pieces,
      grossWeight: op.grossWeight,
      volumetricWeight: op.volumetricWeight,
      volume: op.volume,
      declaredValue: op.declaredValue,
      clientName: op.clientName,
      blNumber: op.blNumber
    };
  });

  profitPercent = computed(() => {
    const cr = this.crossReference();
    if (!cr || cr.totalIncome === 0) return 0;
    return (cr.balance / cr.totalIncome) * 100;
  });

  allCategories = computed(() => {
    const cr = this.crossReference();
    if (!cr) return [];
    const cats = new Set<string>();
    cr.incomeByCategory.forEach(c => cats.add(c.category));
    cr.expenseByCategory.forEach(c => cats.add(c.category));
    return Array.from(cats).sort();
  });

  // Generate form
  agencyFee: number | null = null;

  // Payment form
  paymentAmount: number | null = null;
  paymentMethod = '';
  paymentDate = '';
  paymentDgaRef = '';
  paymentBankRef = '';
  paymentNotes = '';

  canEdit = computed(() => {
    const op = this.operation();
    if (!op) return false;
    return this.authService.hasRole(['ADMIN', 'AGENT']) &&
      ['PAYMENT_PREPARATION', 'IN_TRANSIT'].includes(op.status);
  });

  ngOnInit(): void {
    this.loadData();
    this.clientService.getAll().subscribe(c => this.clients.set(c));
  }

  loadData(): void {
    const id = this.operationId();
    this.paymentService.getLiquidation(id).subscribe({
      next: (l) => {
        this.liquidation.set(l);
        this.loading.set(false);
        if (l?.status === 'PAID') {
          this.paymentService.getPayment(id).subscribe(p => this.payment.set(p));
        }
      },
      error: () => this.loading.set(false)
    });
    this.inspectionService.getCrossReference(id).subscribe({
      next: (cr) => this.crossReference.set(cr),
      error: () => this.crossReference.set(null)
    });
  }

  generate(): void {
    this.generating.set(true);
    this.paymentService.generateLiquidation(this.operationId(), this.agencyFee ?? undefined).subscribe({
      next: (l) => {
        this.liquidation.set(l);
        this.generating.set(false);
        this.changed.emit();
      },
      error: (err) => {
        this.generating.set(false);
        this.handleError(err);
      }
    });
  }

  regenerate(): void {
    this.generating.set(true);
    this.paymentService.generateLiquidation(this.operationId(), this.agencyFee ?? undefined).subscribe({
      next: (l) => {
        this.liquidation.set(l);
        this.generating.set(false);
        this.changed.emit();
      },
      error: (err) => {
        this.generating.set(false);
        this.handleError(err);
      }
    });
  }

  approve(): void {
    const msg = this.translate.instant('PAYMENT.APPROVE_CONFIRM');
    if (!confirm(msg)) return;
    const comment = prompt(this.translate.instant('COMMENTS.PLACEHOLDER'));
    if (comment === null) return;
    this.saving.set(true);
    this.paymentService.approveLiquidation(this.operationId(), comment || undefined).subscribe({
      next: (l) => {
        this.liquidation.set(l);
        this.saving.set(false);
        this.changed.emit();
      },
      error: (err) => {
        this.saving.set(false);
        this.handleError(err);
      }
    });
  }

  makeDefinitive(): void {
    this.saving.set(true);
    this.paymentService.makeLiquidationDefinitive(this.operationId()).subscribe({
      next: (l) => {
        this.liquidation.set(l);
        this.saving.set(false);
        this.changed.emit();
      },
      error: (err) => {
        this.saving.set(false);
        this.handleError(err);
      }
    });
  }

  registerPayment(): void {
    if (!this.paymentAmount || !this.paymentMethod || !this.paymentDate) return;
    this.saving.set(true);
    const request: RegisterPaymentRequest = {
      amount: this.paymentAmount,
      paymentMethod: this.paymentMethod,
      paymentDate: this.paymentDate,
      dgaReference: this.paymentDgaRef || undefined,
      bankReference: this.paymentBankRef || undefined,
      notes: this.paymentNotes || undefined
    };
    this.paymentService.registerPayment(this.operationId(), request).subscribe({
      next: (p) => {
        this.payment.set(p);
        this.saving.set(false);
        this.loadData();
        this.changed.emit();
      },
      error: (err) => {
        this.saving.set(false);
        this.handleError(err);
      }
    });
  }

  getIncomeForCategory(category: string): number | null {
    const cr = this.crossReference();
    if (!cr) return null;
    const found = cr.incomeByCategory.find(c => c.category === category);
    return found ? found.amount : null;
  }

  getExpenseForCategory(category: string): number | null {
    const cr = this.crossReference();
    if (!cr) return null;
    const found = cr.expenseByCategory.find(c => c.category === category);
    return found ? found.amount : null;
  }

  getDescriptionsForCategory(category: string): string[] {
    const cr = this.crossReference();
    if (!cr) return [];
    const descs = new Set<string>();
    cr.incomeByCategory.filter(c => c.category === category).forEach(c => c.descriptions.forEach(d => descs.add(d)));
    cr.expenseByCategory.filter(c => c.category === category).forEach(c => c.descriptions.forEach(d => descs.add(d)));
    return Array.from(descs);
  }

  isReimbursableCategory(category: string): boolean {
    const cr = this.crossReference();
    if (!cr) return false;
    const inIncome = cr.incomeByCategory.find(c => c.category === category);
    if (inIncome?.reimbursable) return true;
    const inExpense = cr.expenseByCategory.find(c => c.category === category);
    return inExpense?.reimbursable ?? false;
  }

  sendToBilling(): void {
    this.sendingToBilling.set(true);
    this.inspectionService.sendAllIncomeToBilling(this.operationId()).subscribe({
      next: (result) => {
        this.sendingToBilling.set(false);
        const msg = this.translate.instant('PAYMENT.SENT_TO_BILLING_SUCCESS', { count: result.updatedCount });
        alert(msg);
        this.inspectionService.getCrossReference(this.operationId()).subscribe({
          next: (cr) => this.crossReference.set(cr),
          error: () => {}
        });
        this.changed.emit();
      },
      error: (err) => {
        this.sendingToBilling.set(false);
        this.handleError(err);
      }
    });
  }

  onChargesChanged(): void {
    // Reload cross-reference
    this.inspectionService.getCrossReference(this.operationId()).subscribe({
      next: (cr) => this.crossReference.set(cr),
      error: () => {}
    });
    // Regenerate liquidation if preliminary
    if (this.liquidation()?.status === 'PRELIMINARY') {
      this.paymentService.generateLiquidation(this.operationId(), this.agencyFee ?? undefined).subscribe({
        next: (l) => this.liquidation.set(l),
        error: () => {}
      });
    }
    this.changed.emit();
  }

  getProfitColor(): string {
    const p = this.profitPercent();
    if (p >= 30) return '#0a6e2d';
    if (p >= 15) return '#198754';
    if (p >= 5) return '#e6a817';
    if (p >= 0) return '#fd7e14';
    return '#dc3545';
  }

  getProfitBg(): string {
    const color = this.getProfitColor();
    return `linear-gradient(135deg, ${color}14, ${color}08)`;
  }

  getProfitBorderColor(): string {
    return this.getProfitColor() + '33';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PRELIMINARY': return 'bg-warning text-dark';
      case 'APPROVED': return 'bg-info';
      case 'DEFINITIVE': return 'bg-primary';
      case 'PAID': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  private handleError(err: { error?: { errorCode?: string; error?: string } }): void {
    if (err.error?.errorCode) {
      const key = 'ERRORS.' + err.error.errorCode;
      const translated = this.translate.instant(key);
      alert(translated !== key ? translated : (err.error.error ?? this.translate.instant('ERRORS.GENERIC_ERROR')));
    } else {
      alert(err.error?.error ?? this.translate.instant('ERRORS.GENERIC_ERROR'));
    }
  }
}
