import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ComplianceRuleConfigService } from '../../../core/services/compliance-rule-config.service';
import { ComplianceRuleConfig } from '../../../core/models/compliance-rule-config.model';

@Component({
  selector: 'app-compliance-config',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>{{ 'COMPLIANCE_CONFIG.TITLE' | translate }}</h2>
      <button class="btn btn-primary" (click)="toggleCreateForm()">
        <i class="bi bi-plus-lg me-1"></i>
        {{ 'COMPLIANCE_CONFIG.CREATE' | translate }}
      </button>
    </div>

    @if (loading()) {
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">{{ 'COMMON.LOADING' | translate }}</span>
        </div>
      </div>
    } @else if (error()) {
      <div class="alert alert-danger" role="alert">
        {{ 'COMPLIANCE_CONFIG.ERROR' | translate }}
      </div>
    } @else {
      @if (successMessage()) {
        <div class="alert alert-success alert-dismissible fade show" role="alert">
          {{ successMessage() | translate }}
          <button type="button" class="btn-close" (click)="successMessage.set('')"></button>
        </div>
      }

      @if (showCreateForm()) {
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="mb-0">{{ 'COMPLIANCE_CONFIG.CREATE_TITLE' | translate }}</h5>
          </div>
          <div class="card-body">
            <form (ngSubmit)="submitCreate()" #createForm="ngForm">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">{{ 'COMPLIANCE_CONFIG.RULE_CODE' | translate }}</label>
                  <select class="form-select" [(ngModel)]="newRule.ruleCode" name="ruleCode" required>
                    <option value="" disabled>{{ 'COMPLIANCE_CONFIG.SELECT_RULE' | translate }}</option>
                    @for (code of knownRuleCodes; track code) {
                      <option [value]="code">{{ getTransition(code) | translate }}</option>
                    }
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">{{ 'COMPLIANCE_CONFIG.PARAM_KEY' | translate }}</label>
                  <input type="text" class="form-control" [(ngModel)]="newRule.paramKey" name="paramKey" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">{{ 'COMPLIANCE_CONFIG.PARAM_VALUE' | translate }}</label>
                  <input type="text" class="form-control" [(ngModel)]="newRule.paramValue" name="paramValue" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">{{ 'COMPLIANCE_CONFIG.DESCRIPTION' | translate }}</label>
                  <input type="text" class="form-control" [(ngModel)]="newRule.description" name="description" />
                </div>
                <div class="col-md-12">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" [(ngModel)]="newRule.enabled" name="enabled" id="newRuleEnabled" />
                    <label class="form-check-label" for="newRuleEnabled">
                      {{ 'COMPLIANCE_CONFIG.ENABLED' | translate }}
                    </label>
                  </div>
                </div>
              </div>
              <div class="mt-3 d-flex gap-2">
                <button type="submit" class="btn btn-success" [disabled]="!createForm.valid">
                  {{ 'COMPLIANCE_CONFIG.SAVE' | translate }}
                </button>
                <button type="button" class="btn btn-outline-secondary" (click)="toggleCreateForm()">
                  {{ 'COMPLIANCE_CONFIG.CANCEL' | translate }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <div class="card">
        <div class="card-body p-0 table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>{{ 'COMPLIANCE_CONFIG.TRANSITION.LABEL' | translate }}</th>
                <th class="d-none d-md-table-cell">{{ 'COMPLIANCE_CONFIG.DESCRIPTION' | translate }}</th>
                <th>{{ 'COMPLIANCE_CONFIG.PARAM_KEY' | translate }}</th>
                <th>{{ 'COMPLIANCE_CONFIG.PARAM_VALUE' | translate }}</th>
                <th>{{ 'COMMON.STATUS' | translate }}</th>
                <th>{{ 'COMMON.ACTIONS' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (rule of rules(); track rule.id) {
                <tr>
                  <td>
                    <small class="text-muted d-block">{{ getTransition(rule.ruleCode) | translate }}</small>
                    <strong>{{ rule.ruleCode }}</strong>
                  </td>
                  <td class="d-none d-md-table-cell text-muted small">{{ rule.description }}</td>
                  <td><code>{{ rule.paramKey }}</code></td>
                  <td>
                    @if (editingId() === rule.id) {
                      <input
                        type="text"
                        class="form-control form-control-sm"
                        [(ngModel)]="editValue"
                        (keyup.enter)="saveEdit(rule)"
                        (keyup.escape)="cancelEdit()" />
                    } @else {
                      <span>{{ rule.paramValue }}</span>
                    }
                  </td>
                  <td>
                    <div class="form-check form-switch">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        [checked]="rule.enabled"
                        (change)="toggleEnabled(rule)"
                        [id]="'switch-' + rule.id" />
                      <label class="form-check-label" [for]="'switch-' + rule.id">
                        {{ (rule.enabled ? 'COMPLIANCE_CONFIG.ENABLED' : 'COMPLIANCE_CONFIG.DISABLED') | translate }}
                      </label>
                    </div>
                  </td>
                  <td>
                    @if (editingId() === rule.id) {
                      <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-success" (click)="saveEdit(rule)">{{ 'COMPLIANCE_CONFIG.SAVE' | translate }}</button>
                        <button class="btn btn-sm btn-outline-secondary" (click)="cancelEdit()">{{ 'COMPLIANCE_CONFIG.CANCEL' | translate }}</button>
                      </div>
                    } @else {
                      <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-outline-primary" (click)="startEdit(rule)">{{ 'COMPLIANCE_CONFIG.EDIT' | translate }}</button>
                        <button class="btn btn-sm btn-outline-danger" (click)="deleteRule(rule)">
                          <i class="bi bi-trash"></i> {{ 'COMPLIANCE_CONFIG.DELETE' | translate }}
                        </button>
                      </div>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="text-center text-muted py-4">{{ 'COMPLIANCE_CONFIG.NO_RULES' | translate }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `
})
export class ComplianceConfigComponent implements OnInit {
  private configService = inject(ComplianceRuleConfigService);
  private translate = inject(TranslateService);

  readonly knownRuleCodes = [
    'COMPLETENESS_REQUIRED',
    'HIGH_VALUE_ADDITIONAL_DOC',
    'RESTRICTED_COUNTRY',
    'COMMERCIAL_INVOICE_REQUIRED',
    'BL_VERIFIED_FOR_VALUATION',
    'PHYSICAL_INSPECTION_GATT',
    'CROSSING_RESOLVED'
  ];

  private readonly ruleTransitions: Record<string, string> = {
    'COMPLETENESS_REQUIRED': 'COMPLIANCE_CONFIG.TRANSITION.COMPLETENESS_REQUIRED',
    'HIGH_VALUE_ADDITIONAL_DOC': 'COMPLIANCE_CONFIG.TRANSITION.HIGH_VALUE_ADDITIONAL_DOC',
    'RESTRICTED_COUNTRY': 'COMPLIANCE_CONFIG.TRANSITION.RESTRICTED_COUNTRY',
    'COMMERCIAL_INVOICE_REQUIRED': 'COMPLIANCE_CONFIG.TRANSITION.COMMERCIAL_INVOICE_REQUIRED',
    'BL_VERIFIED_FOR_VALUATION': 'COMPLIANCE_CONFIG.TRANSITION.BL_VERIFIED_FOR_VALUATION',
    'PHYSICAL_INSPECTION_GATT': 'COMPLIANCE_CONFIG.TRANSITION.PHYSICAL_INSPECTION_GATT',
    'CROSSING_RESOLVED': 'COMPLIANCE_CONFIG.TRANSITION.CROSSING_RESOLVED'
  };

  rules = signal<ComplianceRuleConfig[]>([]);
  loading = signal(true);
  error = signal(false);
  successMessage = signal('');
  editingId = signal<number | null>(null);
  editValue = '';
  showCreateForm = signal(false);
  newRule: Partial<ComplianceRuleConfig> = this.emptyRule();

  getTransition(ruleCode: string): string {
    return this.ruleTransitions[ruleCode] || 'COMPLIANCE_CONFIG.TRANSITION.UNKNOWN';
  }

  ngOnInit(): void {
    this.loadRules();
  }

  toggleCreateForm(): void {
    this.showCreateForm.update(v => !v);
    if (this.showCreateForm()) {
      this.newRule = this.emptyRule();
    }
  }

  submitCreate(): void {
    this.configService.create(this.newRule).subscribe({
      next: () => {
        this.showCreateForm.set(false);
        this.newRule = this.emptyRule();
        this.loadRules();
        this.successMessage.set('COMPLIANCE_CONFIG.CREATED');
      },
      error: () => this.error.set(true)
    });
  }

  deleteRule(rule: ComplianceRuleConfig): void {
    var message = '';
    this.translate.get('COMPLIANCE_CONFIG.DELETE_CONFIRM').subscribe(t => message = t);
    if (!confirm(message)) {
      return;
    }
    this.configService.delete(rule.id).subscribe({
      next: () => {
        this.loadRules();
        this.successMessage.set('COMPLIANCE_CONFIG.DELETED');
      },
      error: () => this.error.set(true)
    });
  }

  toggleEnabled(rule: ComplianceRuleConfig): void {
    this.configService.update(rule.id, {
      paramValue: rule.paramValue,
      enabled: !rule.enabled,
      description: rule.description
    }).subscribe({
      next: () => {
        this.loadRules();
        this.successMessage.set('');
      },
      error: () => this.error.set(true)
    });
  }

  startEdit(rule: ComplianceRuleConfig): void {
    this.editingId.set(rule.id);
    this.editValue = rule.paramValue;
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editValue = '';
  }

  saveEdit(rule: ComplianceRuleConfig): void {
    this.configService.update(rule.id, {
      paramValue: this.editValue,
      enabled: rule.enabled,
      description: rule.description
    }).subscribe({
      next: () => {
        this.editingId.set(null);
        this.editValue = '';
        this.loadRules();
        this.successMessage.set('COMPLIANCE_CONFIG.UPDATED');
      },
      error: () => this.error.set(true)
    });
  }

  private loadRules(): void {
    this.loading.set(true);
    this.configService.getAll().subscribe({
      next: rules => {
        this.rules.set(rules);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  private emptyRule(): Partial<ComplianceRuleConfig> {
    return { ruleCode: '', paramKey: '', paramValue: '', description: '', enabled: true };
  }
}
