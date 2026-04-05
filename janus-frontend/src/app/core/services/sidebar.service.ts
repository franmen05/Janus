import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  collapsed = signal(false);

  constructor() {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved === 'true') {
      this.collapsed.set(true);
    }
    effect(() => {
      localStorage.setItem('sidebarCollapsed', String(this.collapsed()));
    });
  }

  toggle(): void {
    this.collapsed.update(v => !v);
  }
}
