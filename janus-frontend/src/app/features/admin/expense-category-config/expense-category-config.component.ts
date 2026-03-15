import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ExpenseCategoryService } from '../../../core/services/expense-category.service';
import { ExpenseCategoryConfig, CreateExpenseCategoryRequest, UpdateExpenseCategoryRequest } from '../../../core/models/expense-category.model';

@Component({
  selector: 'app-expense-category-config',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>{{ 'EXPENSE_CONFIG.TITLE' | translate }}</h2>
      <button class="btn btn-primary" (click)="toggleCreateForm()">
        <i class="bi bi-plus-lg me-1"></i>
        {{ 'EXPENSE_CONFIG.ADD' | translate }}
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
        {{ error() }}
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
            <h5 class="mb-0">{{ 'EXPENSE_CONFIG.ADD' | translate }}</h5>
          </div>
          <div class="card-body">
            <form (ngSubmit)="submitCreate()" #createForm="ngForm">
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label">{{ 'EXPENSE_CONFIG.NAME' | translate }}</label>
                  <input type="text" class="form-control" [(ngModel)]="newCategory.name" name="name" required
                         placeholder="e.g. LABOR" style="text-transform: uppercase;" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">{{ 'EXPENSE_CONFIG.LABEL_ES' | translate }}</label>
                  <input type="text" class="form-control" [(ngModel)]="newCategory.labelEs" name="labelEs" required />
                </div>
                <div class="col-md-4">
                  <label class="form-label">{{ 'EXPENSE_CONFIG.LABEL_EN' | translate }}</label>
                  <input type="text" class="form-control" [(ngModel)]="newCategory.labelEn" name="labelEn" required />
                </div>
              </div>
              <div class="mt-3 d-flex gap-2">
                <button type="submit" class="btn btn-success" [disabled]="!createForm.valid">
                  {{ 'ACTIONS.SAVE' | translate }}
                </button>
                <button type="button" class="btn btn-outline-secondary" (click)="toggleCreateForm()">
                  {{ 'ACTIONS.CANCEL' | translate }}
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
                <th>{{ 'EXPENSE_CONFIG.NAME' | translate }}</th>
                <th>{{ 'EXPENSE_CONFIG.LABEL_ES' | translate }}</th>
                <th>{{ 'EXPENSE_CONFIG.LABEL_EN' | translate }}</th>
                <th>{{ 'EXPENSE_CONFIG.SORT_ORDER' | translate }}</th>
                <th>{{ 'COMMON.STATUS' | translate }}</th>
                <th>{{ 'COMMON.ACTIONS' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (cat of categories(); track cat.id) {
                <tr>
                  <td><code>{{ cat.name }}</code></td>
                  <td>
                    @if (editingId() === cat.id) {
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="editLabelEs"
                             (keyup.escape)="cancelEdit()" />
                    } @else {
                      {{ cat.labelEs }}
                    }
                  </td>
                  <td>
                    @if (editingId() === cat.id) {
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="editLabelEn"
                             (keyup.escape)="cancelEdit()" />
                    } @else {
                      {{ cat.labelEn }}
                    }
                  </td>
                  <td>
                    @if (editingId() === cat.id) {
                      <input type="number" class="form-control form-control-sm" [(ngModel)]="editSortOrder"
                             style="width: 80px;" (keyup.enter)="saveEdit(cat)" (keyup.escape)="cancelEdit()" />
                    } @else {
                      {{ cat.sortOrder }}
                    }
                  </td>
                  <td>
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" role="switch"
                             [checked]="cat.active" (change)="toggleActive(cat)"
                             [id]="'switch-' + cat.id" />
                      <label class="form-check-label" [for]="'switch-' + cat.id">
                        {{ (cat.active ? 'EXPENSE_CONFIG.ACTIVE' : 'EXPENSE_CONFIG.INACTIVE') | translate }}
                      </label>
                    </div>
                  </td>
                  <td>
                    @if (editingId() === cat.id) {
                      <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-success" (click)="saveEdit(cat)">{{ 'ACTIONS.SAVE' | translate }}</button>
                        <button class="btn btn-sm btn-outline-secondary" (click)="cancelEdit()">{{ 'ACTIONS.CANCEL' | translate }}</button>
                      </div>
                    } @else {
                      <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-outline-primary" (click)="startEdit(cat)">{{ 'ACTIONS.EDIT' | translate }}</button>
                        <button class="btn btn-sm btn-outline-danger" (click)="deleteCategory(cat)">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="text-center text-muted py-4">{{ 'COMMON.NO_DATA' | translate }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `
})
export class ExpenseCategoryConfigComponent implements OnInit {
  private categoryService = inject(ExpenseCategoryService);
  private translate = inject(TranslateService);

  categories = signal<ExpenseCategoryConfig[]>([]);
  loading = signal(true);
  error = signal('');
  successMessage = signal('');
  editingId = signal<number | null>(null);
  showCreateForm = signal(false);

  editLabelEs = '';
  editLabelEn = '';
  editSortOrder = 0;

  newCategory: Partial<CreateExpenseCategoryRequest> = this.emptyCategory();

  ngOnInit(): void {
    this.loadCategories();
  }

  toggleCreateForm(): void {
    this.showCreateForm.update(v => !v);
    if (this.showCreateForm()) {
      this.newCategory = this.emptyCategory();
    }
  }

  submitCreate(): void {
    const request: CreateExpenseCategoryRequest = {
      name: (this.newCategory.name || '').toUpperCase(),
      labelEs: this.newCategory.labelEs || '',
      labelEn: this.newCategory.labelEn || ''
    };
    this.categoryService.create(request).subscribe({
      next: () => {
        this.showCreateForm.set(false);
        this.newCategory = this.emptyCategory();
        this.loadCategories();
        this.showSuccess('EXPENSE_CONFIG.CREATED');
      },
      error: () => this.error.set('Error creating category')
    });
  }

  deleteCategory(cat: ExpenseCategoryConfig): void {
    var message = '';
    this.translate.get('EXPENSE_CONFIG.DELETE_CONFIRM').subscribe(t => message = t);
    if (!confirm(message)) {
      return;
    }
    this.categoryService.delete(cat.id).subscribe({
      next: () => {
        this.loadCategories();
        this.showSuccess('EXPENSE_CONFIG.DELETED');
      },
      error: () => this.error.set('Error deleting category')
    });
  }

  toggleActive(cat: ExpenseCategoryConfig): void {
    this.categoryService.toggle(cat.id).subscribe({
      next: () => {
        this.loadCategories();
        this.successMessage.set('');
      },
      error: () => this.error.set('Error toggling category')
    });
  }

  startEdit(cat: ExpenseCategoryConfig): void {
    this.editingId.set(cat.id);
    this.editLabelEs = cat.labelEs;
    this.editLabelEn = cat.labelEn;
    this.editSortOrder = cat.sortOrder;
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editLabelEs = '';
    this.editLabelEn = '';
    this.editSortOrder = 0;
  }

  saveEdit(cat: ExpenseCategoryConfig): void {
    const request: UpdateExpenseCategoryRequest = {
      labelEs: this.editLabelEs,
      labelEn: this.editLabelEn,
      sortOrder: this.editSortOrder
    };
    this.categoryService.update(cat.id, request).subscribe({
      next: () => {
        this.editingId.set(null);
        this.loadCategories();
        this.showSuccess('EXPENSE_CONFIG.UPDATED');
      },
      error: () => this.error.set('Error updating category')
    });
  }

  private loadCategories(): void {
    this.loading.set(true);
    this.categoryService.getAll().subscribe({
      next: categories => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error loading categories');
        this.loading.set(false);
      }
    });
  }

  private showSuccess(key: string): void {
    this.successMessage.set(key);
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  private emptyCategory(): Partial<CreateExpenseCategoryRequest> {
    return { name: '', labelEs: '', labelEn: '' };
  }
}
