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
import { ChargesTableComponent } from '../../../shared/components/charges-table/charges-table.component';

@Component({
  selector: 'app-payment-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ChargesTableComponent],
  template: `
    <!-- Cross-Reference Section -->
    @if (crossReference()) {
      <div class="card mb-3">
        <div class="card-header">
          <h6 class="mb-0"><i class="bi bi-arrow-left-right me-2"></i>{{ 'PAYMENT.CROSS_REFERENCE_TITLE' | translate }}</h6>
        </div>
        <div class="card-body">
          @if (crossReference()!.totalIncome === 0 && crossReference()!.totalExpenses === 0) {
            <p class="text-muted text-center mb-0">{{ 'PAYMENT.NO_CHARGES' | translate }}</p>
          } @else {
            <!-- Summary cards -->
            <div class="row g-3 mb-3">
              <div class="col-md-4">
                <div class="card border">
                  <div class="card-body py-2 text-center">
                    <small class="text-muted d-block">{{ 'PAYMENT.TOTAL_INCOME' | translate }}</small>
                    <strong class="fs-6 text-success">{{ crossReference()!.totalIncome | number:'1.2-2' }}</strong>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card border">
                  <div class="card-body py-2 text-center">
                    <small class="text-muted d-block">{{ 'PAYMENT.TOTAL_EXPENSES' | translate }}</small>
                    <strong class="fs-6 text-danger">{{ crossReference()!.totalExpenses | number:'1.2-2' }}</strong>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card border">
                  <div class="card-body py-2 text-center">
                    <small class="text-muted d-block">{{ 'PAYMENT.BALANCE' | translate }}</small>
                    <strong class="fs-6" [ngClass]="{
                      'text-success': crossReference()!.balance > 0,
                      'text-danger': crossReference()!.balance < 0,
                      'text-muted': crossReference()!.balance === 0
                    }">{{ crossReference()!.balance | number:'1.2-2' }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Breakdown table -->
            @if (allCategories().length > 0) {
              <div class="table-responsive mb-3">
                <table class="table table-sm table-hover">
                  <thead>
                    <tr>
                      <th>{{ 'PAYMENT.CATEGORY' | translate }}</th>
                      <th class="text-end text-success">{{ 'PAYMENT.INCOME' | translate }}</th>
                      <th class="text-end text-danger">{{ 'PAYMENT.EXPENSES' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (cat of allCategories(); track cat) {
                      <tr>
                        <td>{{ 'INSPECTION.CATEGORY_' + cat | translate }}</td>
                        <td class="text-end">{{ getIncomeForCategory(cat) !== null ? (getIncomeForCategory(cat)! | number:'1.2-2') : '-' }}</td>
                        <td class="text-end">{{ getExpenseForCategory(cat) !== null ? (getExpenseForCategory(cat)! | number:'1.2-2') : '-' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            <!-- Send to billing -->
            @if (authService.hasRole(['ADMIN', 'AGENT'])) {
              <div class="d-flex align-items-center justify-content-between border-top pt-3">
                <span class="text-muted">
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
            }
          }
        </div>
      </div>
    }

    <!-- Charges Table -->
    <app-charges-table class="mb-3 d-block"
      [operationId]="operationId()"
      [operation]="operation()"
      [operationSummary]="operationSummary()"
      [clients]="clients()"
      (changed)="onChargesChanged()" />

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0"><i class="bi bi-cash-stack me-2"></i>{{ 'PAYMENT.TITLE' | translate }}</h6>
        @if (liquidation()) {
          <span class="badge" [ngClass]="getStatusBadgeClass(liquidation()!.status)">
            {{ 'PAYMENT.STATUS_' + liquidation()!.status | translate }}
          </span>
        }
      </div>
      <div class="card-body">
        @if (!liquidation()) {
          <!-- No liquidation yet -->
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
        } @else {
          <!-- Summary cards -->
          <div class="row g-3 mb-4">
            <div class="col-6 col-md-3">
              <div class="card border">
                <div class="card-body py-2 text-center">
                  <small class="text-muted d-block">{{ 'PAYMENT.CUSTOMS_TAXES' | translate }}</small>
                  <strong class="fs-6">{{ liquidation()!.totalCustomsTaxes | number:'1.2-2' }}</strong>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="card border">
                <div class="card-body py-2 text-center">
                  <small class="text-muted d-block">{{ 'PAYMENT.THIRD_PARTY' | translate }}</small>
                  <strong class="fs-6">{{ liquidation()!.totalThirdParty | number:'1.2-2' }}</strong>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="card border">
                <div class="card-body py-2 text-center">
                  <small class="text-muted d-block">{{ 'PAYMENT.AGENCY_SERVICES' | translate }}</small>
                  <strong class="fs-6">{{ liquidation()!.totalAgencyServices | number:'1.2-2' }}</strong>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="card bg-primary text-white border-0">
                <div class="card-body py-2 text-center">
                  <small class="d-block" style="opacity:0.8">{{ 'PAYMENT.GRAND_TOTAL' | translate }}</small>
                  <strong class="fs-5">{{ liquidation()!.grandTotal | number:'1.2-2' }}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Lines table -->
          @if (liquidation()!.lines.length > 0) {
            <h6 class="mb-2">{{ 'PAYMENT.LINES_TITLE' | translate }}</h6>
            <div class="table-responsive mb-3">
              <table class="table table-sm table-hover">
                <thead>
                  <tr>
                    <th>{{ 'PAYMENT.CONCEPT' | translate }}</th>
                    <th class="d-none d-sm-table-cell">{{ 'PAYMENT.DESCRIPTION' | translate }}</th>
                    <th class="text-end">{{ 'PAYMENT.AMOUNT' | translate }}</th>
                    <th>{{ 'PAYMENT.TYPE' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (line of liquidation()!.lines; track line.id) {
                    <tr>
                      <td>{{ 'PAYMENT.CONCEPT_' + line.concept | translate }}</td>
                      <td class="d-none d-sm-table-cell">{{ line.description ?? '-' }}</td>
                      <td class="text-end">{{ line.amount | number:'1.2-2' }}</td>
                      <td>
                        @if (line.reimbursable) {
                          <span class="badge bg-info">{{ 'PAYMENT.REIMBURSABLE' | translate }}</span>
                        } @else {
                          <span class="badge bg-secondary">{{ 'PAYMENT.OWN_SERVICE' | translate }}</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <!-- DGA Payment Code -->
          @if (liquidation()!.dgaPaymentCode) {
            <div class="mb-3">
              <strong>{{ 'PAYMENT.DGA_PAYMENT_CODE' | translate }}:</strong>
              <span class="ms-2">{{ liquidation()!.dgaPaymentCode }}</span>
            </div>
          }

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
              <div class="card border-primary mt-2">
                <div class="card-body">
                  <h6>{{ 'PAYMENT.MAKE_DEFINITIVE' | translate }}</h6>
                  <div class="row g-2 align-items-end">
                    <div class="col-md-6">
                      <label class="form-label">{{ 'PAYMENT.DGA_PAYMENT_CODE' | translate }} <span class="text-danger">*</span></label>
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="dgaPaymentCode"
                             [placeholder]="'PAYMENT.DGA_PAYMENT_CODE_PLACEHOLDER' | translate">
                    </div>
                    <div class="col-md-6">
                      <button class="btn btn-primary btn-sm" (click)="makeDefinitive()" [disabled]="!dgaPaymentCode || saving()">
                        @if (saving()) {
                          <span class="spinner-border spinner-border-sm me-1"></span>
                        }
                        {{ 'PAYMENT.MAKE_DEFINITIVE' | translate }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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

  // Make definitive form
  dgaPaymentCode = '';

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
    this.paymentService.getLiquidation(id).subscribe(l => {
      this.liquidation.set(l);
      if (l?.status === 'PAID') {
        this.paymentService.getPayment(id).subscribe(p => this.payment.set(p));
      }
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
    if (!this.dgaPaymentCode) return;
    this.saving.set(true);
    this.paymentService.makeLiquidationDefinitive(this.operationId(), this.dgaPaymentCode).subscribe({
      next: (l) => {
        this.liquidation.set(l);
        this.saving.set(false);
        this.dgaPaymentCode = '';
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
