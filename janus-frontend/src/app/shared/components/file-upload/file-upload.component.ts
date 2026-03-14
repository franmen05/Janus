import { Component, output, input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    @if (!multiple()) {
      <!-- Single file mode (original behavior) -->
      <div class="upload-zone border rounded p-4 text-center"
           [class.border-primary]="isDragging"
           (dragover)="onDragOver($event)"
           (dragleave)="isDragging = false"
           (drop)="onDrop($event)">
        @if (!selectedFile) {
          <div>
            <p class="mb-2">{{ 'FILE_UPLOAD.DRAG_DROP' | translate }}</p>
            <label class="btn btn-outline-primary">
              {{ 'FILE_UPLOAD.BROWSE' | translate }}
              <input type="file" class="d-none" accept=".pdf,.jpg,.jpeg,.png" (change)="onFileSelect($event)">
            </label>
            <p class="text-muted mt-2"><small>{{ 'FILE_UPLOAD.ALLOWED' | translate:{ size: maxSizeMb } }}</small></p>
          </div>
        } @else {
          <div>
            <p class="mb-1 fw-bold">{{ selectedFile.name }}</p>
            <p class="text-muted mb-2"><small>{{ formatSize(selectedFile.size) }}</small></p>
            <button class="btn btn-sm btn-outline-danger" (click)="clear()">{{ 'FILE_UPLOAD.REMOVE' | translate }}</button>
          </div>
        }
      </div>
    } @else {
      <!-- Multiple file mode -->
      <div class="upload-zone border rounded p-4 text-center"
           [class.border-primary]="isDragging"
           (dragover)="onDragOver($event)"
           (dragleave)="isDragging = false"
           (drop)="onDropMultiple($event)">
        <div>
          <p class="mb-2">{{ 'FILE_UPLOAD.DRAG_DROP_MULTIPLE' | translate }}</p>
          <label class="btn btn-outline-primary">
            {{ 'FILE_UPLOAD.BROWSE_MULTIPLE' | translate }}
            <input type="file" class="d-none" accept=".pdf,.jpg,.jpeg,.png" multiple (change)="onMultiFileSelect($event)">
          </label>
          <p class="text-muted mt-2"><small>{{ 'FILE_UPLOAD.ALLOWED' | translate:{ size: maxSizeMb } }}</small></p>
        </div>
      </div>
      @if (selectedFiles().length > 0) {
        <div class="mt-2">
          <small class="text-muted">{{ 'FILE_UPLOAD.FILES_SELECTED' | translate:{ count: selectedFiles().length } }}</small>
          <ul class="list-group mt-1">
            @for (file of selectedFiles(); track $index) {
              <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                <div>
                  <span class="fw-medium">{{ file.name }}</span>
                  <small class="text-muted ms-2">{{ formatSize(file.size) }}</small>
                </div>
                <button class="btn btn-sm btn-outline-danger" (click)="removeFile($index)">
                  <i class="bi bi-x-lg"></i>
                </button>
              </li>
            }
          </ul>
        </div>
      }
    }
  `,
  styles: [`.upload-zone { cursor: pointer; border-style: dashed !important; transition: border-color 0.2s; }`]
})
export class FileUploadComponent {
  private translate = inject(TranslateService);
  private toastService = inject(ToastService);
  maxSize = input<number>(10485760);
  multiple = input(false);
  fileSelected = output<File>();
  filesSelected = output<File[]>();

  get maxSizeMb() { return Math.round(this.maxSize() / 1024 / 1024); }

  isDragging = false;
  selectedFile: File | null = null;
  selectedFiles = signal<File[]>([]);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.selectFile(file);
  }

  onDropMultiple(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files) {
      this.addFiles(Array.from(files));
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.selectFile(file);
  }

  onMultiFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files) {
      this.addFiles(Array.from(files));
    }
    input.value = '';
  }

  selectFile(file: File): void {
    if (file.size > this.maxSize()) {
      this.toastService.warning(this.translate.instant('FILE_UPLOAD.FILE_TOO_LARGE', { size: this.maxSizeMb }));
      return;
    }
    this.selectedFile = file;
    this.fileSelected.emit(file);
  }

  private addFiles(files: File[]): void {
    const valid: File[] = [];
    for (const file of files) {
      if (file.size > this.maxSize()) {
        this.toastService.warning(this.translate.instant('FILE_UPLOAD.FILE_TOO_LARGE', { size: this.maxSizeMb }));
      } else {
        valid.push(file);
      }
    }
    if (valid.length > 0) {
      this.selectedFiles.update(current => [...current, ...valid]);
      this.filesSelected.emit(this.selectedFiles());
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
    this.filesSelected.emit(this.selectedFiles());
  }

  clear(): void {
    this.selectedFile = null;
    this.selectedFiles.set([]);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}
