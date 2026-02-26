import { Component, inject } from '@angular/core';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [NgbToastModule],
  template: `
    @for (toast of toastService.toasts(); track toast) {
      <ngb-toast
        [class]="toastClass(toast)"
        [autohide]="toast.autohide"
        [delay]="toast.delay"
        (hidden)="toastService.remove(toast)">
        {{ toast.message }}
      </ngb-toast>
    }
  `,
  styles: [`
    :host {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 1200;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  toastClass(toast: Toast): string {
    const typeMap: Record<string, string> = {
      success: 'bg-success text-white',
      error: 'bg-danger text-white',
      warning: 'bg-warning text-dark',
      info: 'bg-info text-dark'
    };
    return typeMap[toast.type] ?? '';
  }
}
