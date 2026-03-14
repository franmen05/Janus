import { Injectable, signal, computed, OnDestroy } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'auto';

@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {
  currentMode = signal<ThemeMode>('auto');
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  private mediaListener = (e: MediaQueryListEvent) => this.applyTheme(this.currentMode(), e.matches);

  effectiveTheme = computed(() => {
    const mode = this.currentMode();
    if (mode === 'auto') {
      return this.mediaQuery.matches ? 'dark' : 'light';
    }
    return mode;
  });

  init(): void {
    const stored = localStorage.getItem('janus-theme') as ThemeMode | null;
    const mode = stored ?? 'auto';
    this.setMode(mode);
    this.mediaQuery.addEventListener('change', this.mediaListener);
  }

  setMode(mode: ThemeMode): void {
    this.currentMode.set(mode);
    localStorage.setItem('janus-theme', mode);
    this.applyTheme(mode, this.mediaQuery.matches);
  }

  private applyTheme(mode: ThemeMode, systemDark: boolean): void {
    const isDark = mode === 'dark' || (mode === 'auto' && systemDark);
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
  }

  ngOnDestroy(): void {
    this.mediaQuery.removeEventListener('change', this.mediaListener);
  }
}
