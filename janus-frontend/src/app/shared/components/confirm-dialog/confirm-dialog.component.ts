import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ title() }}</h5>
      <button type="button" class="btn-close" (click)="modal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <p>{{ message() }}</p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-secondary" (click)="modal.dismiss()">Cancel</button>
      <button type="button" class="btn btn-primary" (click)="modal.close(true)">Confirm</button>
    </div>
  `
})
export class ConfirmDialogComponent {
  title = input<string>('Confirm');
  message = input<string>('Are you sure?');

  constructor(public modal: NgbActiveModal) {}
}
