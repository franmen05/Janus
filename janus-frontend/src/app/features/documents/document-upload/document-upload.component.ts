import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DocumentService } from '../../../core/services/document.service';
import { DocumentType, DocumentStatus } from '../../../core/models/document.model';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, FileUploadComponent],
  template: `
    <h2 class="mb-4">{{ 'DOCUMENTS.UPLOAD_TITLE' | translate }}</h2>
    <div class="card">
      <div class="card-body">
        <div class="mb-3">
          <label class="form-label">{{ 'DOCUMENTS.DOCUMENT_TYPE' | translate }}</label>
          <select class="form-select" [(ngModel)]="selectedType">
            @for (t of documentTypes; track t.value) { <option [value]="t.value">{{ t.labelKey | translate }}</option> }
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">{{ 'DOCUMENTS.CHANGE_REASON' | translate }}</label>
          <input type="text" class="form-control" [(ngModel)]="changeReason" [placeholder]="'DOCUMENTS.CHANGE_REASON_PLACEHOLDER' | translate">
        </div>
        <div class="mb-3">
          <app-file-upload (fileSelected)="onFileSelected($event)" />
        </div>
        @if (uploading()) {
          <div class="progress mb-3">
            <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%">{{ 'DOCUMENTS.UPLOADING' | translate }}</div>
          </div>
        }
        <div class="d-flex gap-2">
          <button class="btn btn-primary" (click)="onUpload()" [disabled]="!selectedFile || uploading()">{{ 'ACTIONS.UPLOAD' | translate }}</button>
          <button class="btn btn-outline-secondary" (click)="onCancel()">{{ 'ACTIONS.CANCEL' | translate }}</button>
        </div>
      </div>
    </div>
  `
})
export class DocumentUploadComponent {
  private documentService = inject(DocumentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private toastService = inject(ToastService);

  selectedType = DocumentType.BL;
  selectedFile: File | null = null;
  changeReason = '';
  uploading = signal(false);

  documentTypes = [
    { value: DocumentType.BL, labelKey: 'DOCUMENT_TYPES.BL' },
    { value: DocumentType.COMMERCIAL_INVOICE, labelKey: 'DOCUMENT_TYPES.COMMERCIAL_INVOICE' },
    { value: DocumentType.PACKING_LIST, labelKey: 'DOCUMENT_TYPES.PACKING_LIST' },
    { value: DocumentType.CERTIFICATE, labelKey: 'DOCUMENT_TYPES.CERTIFICATE' },
    { value: DocumentType.OTHER, labelKey: 'DOCUMENT_TYPES.OTHER' }
  ];

  onFileSelected(file: File): void { this.selectedFile = file; }

  onUpload(): void {
    if (!this.selectedFile) return;
    const operationId = +this.route.snapshot.paramMap.get('id')!;
    this.uploading.set(true);
    this.documentService.upload(operationId, this.selectedFile, this.selectedType, this.changeReason || undefined).subscribe({
      next: (doc) => {
        this.uploading.set(false);
        const statusToastMap: Record<string, () => void> = {
          [DocumentStatus.VALIDATED]: () => this.toastService.success(this.translate.instant('UPLOAD.VALIDATED')),
          [DocumentStatus.OBSERVED]: () => this.toastService.warning(this.translate.instant('UPLOAD.OBSERVED')),
          [DocumentStatus.REQUIRES_REPLACEMENT]: () => this.toastService.error(this.translate.instant('UPLOAD.REQUIRES_REPLACEMENT')),
          [DocumentStatus.PENDING]: () => this.toastService.info(this.translate.instant('UPLOAD.PENDING'))
        };
        const showToast = statusToastMap[doc.status];
        if (showToast) {
          showToast();
        } else {
          this.toastService.info(`${this.translate.instant('ACTIONS.UPLOAD')}: ${doc.status}`);
        }
        this.router.navigate(['/operations', operationId], { queryParams: { tab: 'documents' } });
      },
      error: (err) => { this.uploading.set(false); this.toastService.error(err.error?.error ?? this.translate.instant('UPLOAD.FAILED')); }
    });
  }

  onCancel(): void {
    const operationId = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/operations', operationId]);
  }
}
