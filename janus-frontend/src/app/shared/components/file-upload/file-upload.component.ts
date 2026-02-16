import { Component, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upload-zone border rounded p-4 text-center"
         [class.border-primary]="isDragging"
         (dragover)="onDragOver($event)"
         (dragleave)="isDragging = false"
         (drop)="onDrop($event)">
      @if (!selectedFile) {
        <div>
          <p class="mb-2">Drag & drop a file here, or</p>
          <label class="btn btn-outline-primary">
            Browse Files
            <input type="file" class="d-none" accept=".pdf,.jpg,.jpeg,.png" (change)="onFileSelect($event)">
          </label>
          <p class="text-muted mt-2"><small>Allowed: PDF, JPG, PNG. Max: {{ maxSizeMb }}MB</small></p>
        </div>
      } @else {
        <div>
          <p class="mb-1 fw-bold">{{ selectedFile.name }}</p>
          <p class="text-muted mb-2"><small>{{ formatSize(selectedFile.size) }}</small></p>
          <button class="btn btn-sm btn-outline-danger" (click)="clear()">Remove</button>
        </div>
      }
    </div>
  `,
  styles: [`.upload-zone { cursor: pointer; border-style: dashed !important; transition: border-color 0.2s; }`]
})
export class FileUploadComponent {
  maxSize = input<number>(10485760);
  fileSelected = output<File>();

  get maxSizeMb() { return Math.round(this.maxSize() / 1024 / 1024); }

  isDragging = false;
  selectedFile: File | null = null;

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

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.selectFile(file);
  }

  selectFile(file: File): void {
    if (file.size > this.maxSize()) {
      alert('File exceeds maximum size of ' + this.maxSizeMb + 'MB');
      return;
    }
    this.selectedFile = file;
    this.fileSelected.emit(file);
  }

  clear(): void { this.selectedFile = null; }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}
