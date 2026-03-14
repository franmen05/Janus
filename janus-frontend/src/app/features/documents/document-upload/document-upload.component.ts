import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DocumentService } from '../../../core/services/document.service';
import { DocumentType, DocumentStatus, DocumentTypeConfig } from '../../../core/models/document.model';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { ToastService } from '../../../core/services/toast.service';
import { getErrorMessage } from '../../../core/utils/error-message.util';

interface FileEntry {
  file: File;
  displayName: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

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
          <select class="form-select" [(ngModel)]="selectedType" (ngModelChange)="onTypeChange()">
            @for (t of documentTypes; track t.value) { <option [value]="t.value">{{ t.labelKey | translate }}</option> }
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">{{ 'DOCUMENTS.CHANGE_REASON' | translate }}</label>
          <input type="text" class="form-control" [(ngModel)]="changeReason" [placeholder]="'DOCUMENTS.CHANGE_REASON_PLACEHOLDER' | translate">
        </div>

        @if (isMultipleAllowed()) {
          <div class="alert alert-info mb-3">
            <i class="bi bi-info-circle me-1"></i>
            {{ 'DOCUMENTS.MULTI_UPLOAD_HINT' | translate }}
          </div>
          <div class="mb-3">
            <app-file-upload [multiple]="true" (filesSelected)="onFilesSelected($event)" />
          </div>

          @if (fileEntries().length > 0) {
            <div class="mb-3">
              <label class="form-label">{{ 'DOCUMENTS.FILE_NAME' | translate }}</label>
              @for (entry of fileEntries(); track $index) {
                <div class="input-group mb-2">
                  <input type="text" class="form-control" [(ngModel)]="entry.displayName">
                  <span class="input-group-text">
                    @switch (entry.status) {
                      @case ('uploading') { <span class="spinner-border spinner-border-sm text-primary"></span> }
                      @case ('done') { <i class="bi bi-check-circle text-success"></i> }
                      @case ('error') { <i class="bi bi-x-circle text-danger"></i> }
                      @default { <i class="bi bi-file-earmark text-muted"></i> }
                    }
                  </span>
                </div>
              }
            </div>
          }

          @if (uploading()) {
            <div class="progress mb-3">
              <div class="progress-bar progress-bar-striped progress-bar-animated"
                   [style.width.%]="uploadProgress()">
                {{ 'DOCUMENTS.UPLOADING_FILE' | translate:{ current: uploadCurrent(), total: uploadTotal() } }}
              </div>
            </div>
          }
          <div class="d-flex gap-2">
            <button class="btn btn-primary" (click)="onUploadMultiple()" [disabled]="fileEntries().length === 0 || uploading()">{{ 'ACTIONS.UPLOAD' | translate }}</button>
            <button class="btn btn-outline-secondary" (click)="onCancel()">{{ 'ACTIONS.CANCEL' | translate }}</button>
          </div>
        } @else {
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
        }
      </div>
    </div>
  `
})
export class DocumentUploadComponent implements OnInit {
  private documentService = inject(DocumentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private toastService = inject(ToastService);

  selectedType = DocumentType.BL;
  selectedFile: File | null = null;
  changeReason = '';
  uploading = signal(false);
  uploadCurrent = signal(0);
  uploadTotal = signal(0);
  uploadProgress = signal(0);

  documentTypeConfigs = signal<DocumentTypeConfig[]>([]);
  isMultipleAllowed = signal(false);
  fileEntries = signal<FileEntry[]>([]);

  documentTypes = [
    { value: DocumentType.BL, labelKey: 'DOCUMENT_TYPES.BL' },
    { value: DocumentType.COMMERCIAL_INVOICE, labelKey: 'DOCUMENT_TYPES.COMMERCIAL_INVOICE' },
    { value: DocumentType.PACKING_LIST, labelKey: 'DOCUMENT_TYPES.PACKING_LIST' },
    { value: DocumentType.CERTIFICATE, labelKey: 'DOCUMENT_TYPES.CERTIFICATE' },
    { value: DocumentType.OTHER, labelKey: 'DOCUMENT_TYPES.OTHER' }
  ];

  ngOnInit(): void {
    this.documentService.getDocumentTypes().subscribe({
      next: configs => {
        this.documentTypeConfigs.set(configs);
        this.onTypeChange();
      }
    });
  }

  onTypeChange(): void {
    const config = this.documentTypeConfigs().find(c => c.code === this.selectedType);
    this.isMultipleAllowed.set(config?.allowMultiple ?? false);
    this.fileEntries.set([]);
    this.selectedFile = null;
  }

  onFileSelected(file: File): void { this.selectedFile = file; }

  onFilesSelected(files: File[]): void {
    this.fileEntries.set(files.map(f => ({
      file: f,
      displayName: this.getNameWithoutExtension(f.name),
      status: 'pending' as const
    })));
  }

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
      error: (err) => { this.uploading.set(false); this.toastService.error(getErrorMessage(err, this.translate)); }
    });
  }

  onUploadMultiple(): void {
    const entries = this.fileEntries();
    if (entries.length === 0) return;
    const operationId = +this.route.snapshot.paramMap.get('id')!;
    this.uploading.set(true);
    this.uploadTotal.set(entries.length);
    this.uploadCurrent.set(0);
    this.uploadSequential(operationId, entries, 0);
  }

  private uploadSequential(operationId: number, entries: FileEntry[], index: number): void {
    if (index >= entries.length) {
      this.uploading.set(false);
      this.toastService.success(this.translate.instant('UPLOAD.VALIDATED'));
      this.router.navigate(['/operations', operationId], { queryParams: { tab: 'documents' } });
      return;
    }

    const entry = entries[index];
    entry.status = 'uploading';
    this.fileEntries.set([...entries]);
    this.uploadCurrent.set(index + 1);
    this.uploadProgress.set(Math.round(((index + 1) / entries.length) * 100));

    const ext = this.getExtension(entry.file.name);
    const originalName = entry.displayName + ext;

    this.documentService.upload(
      operationId, entry.file, this.selectedType, this.changeReason || undefined, originalName
    ).subscribe({
      next: () => {
        entry.status = 'done';
        this.fileEntries.set([...entries]);
        this.uploadSequential(operationId, entries, index + 1);
      },
      error: (err) => {
        entry.status = 'error';
        this.fileEntries.set([...entries]);
        this.toastService.error(getErrorMessage(err, this.translate));
        this.uploadSequential(operationId, entries, index + 1);
      }
    });
  }

  onCancel(): void {
    const operationId = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/operations', operationId]);
  }

  private getNameWithoutExtension(name: string): string {
    const lastDot = name.lastIndexOf('.');
    return lastDot > 0 ? name.substring(0, lastDot) : name;
  }

  private getExtension(name: string): string {
    const lastDot = name.lastIndexOf('.');
    return lastDot > 0 ? name.substring(lastDot) : '';
  }
}
