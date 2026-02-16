import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentService } from '../../../core/services/document.service';
import { DocumentType } from '../../../core/models/document.model';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, FileUploadComponent],
  template: `
    <h2 class="mb-4">Upload Document</h2>
    <div class="card">
      <div class="card-body">
        <div class="mb-3">
          <label class="form-label">Document Type</label>
          <select class="form-select" [(ngModel)]="selectedType">
            @for (t of documentTypes; track t.value) { <option [value]="t.value">{{ t.label }}</option> }
          </select>
        </div>
        <div class="mb-3">
          <app-file-upload (fileSelected)="onFileSelected($event)" />
        </div>
        @if (uploading()) {
          <div class="progress mb-3">
            <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%">Uploading...</div>
          </div>
        }
        <div class="d-flex gap-2">
          <button class="btn btn-primary" (click)="onUpload()" [disabled]="!selectedFile || uploading()">Upload</button>
          <button class="btn btn-outline-secondary" (click)="onCancel()">Cancel</button>
        </div>
      </div>
    </div>
  `
})
export class DocumentUploadComponent {
  private documentService = inject(DocumentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  selectedType = DocumentType.BL;
  selectedFile: File | null = null;
  uploading = signal(false);

  documentTypes = [
    { value: DocumentType.BL, label: 'Bill of Lading (BL)' },
    { value: DocumentType.COMMERCIAL_INVOICE, label: 'Commercial Invoice' },
    { value: DocumentType.PACKING_LIST, label: 'Packing List' },
    { value: DocumentType.CERTIFICATE, label: 'Certificate' },
    { value: DocumentType.OTHER, label: 'Other' }
  ];

  onFileSelected(file: File): void { this.selectedFile = file; }

  onUpload(): void {
    if (!this.selectedFile) return;
    const operationId = +this.route.snapshot.paramMap.get('id')!;
    this.uploading.set(true);
    this.documentService.upload(operationId, this.selectedFile, this.selectedType).subscribe({
      next: () => this.router.navigate(['/operations', operationId]),
      error: (err) => { this.uploading.set(false); alert(err.error?.error ?? 'Upload failed'); }
    });
  }

  onCancel(): void {
    const operationId = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/operations', operationId]);
  }
}
