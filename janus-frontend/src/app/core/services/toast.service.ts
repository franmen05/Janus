import { Injectable, signal } from '@angular/core';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  autohide: boolean;
  delay: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  success(message: string): void {
    this.show({ message, type: 'success', autohide: true, delay: 5000 });
  }

  error(message: string): void {
    this.show({ message, type: 'error', autohide: true, delay: 8000 });
  }

  warning(message: string): void {
    this.show({ message, type: 'warning', autohide: true, delay: 8000 });
  }

  info(message: string): void {
    this.show({ message, type: 'info', autohide: true, delay: 5000 });
  }

  remove(toast: Toast): void {
    this.toasts.update(current => current.filter(t => t !== toast));
  }

  private show(toast: Toast): void {
    this.toasts.update(current => [...current, toast]);
  }
}
