import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translate = inject(TranslateService);
  currentLanguage = signal<string>('es');
  availableLanguages = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' }
  ];

  init(): void {
    this.translate.addLangs(['es', 'en']);
    this.translate.setDefaultLang('es');

    const stored = localStorage.getItem('janus-lang');
    const browserLang = this.translate.getBrowserLang();
    const lang = stored ?? (browserLang && ['es', 'en'].includes(browserLang) ? browserLang : 'es');

    this.setLanguage(lang);
  }

  setLanguage(lang: string): void {
    this.translate.use(lang);
    this.currentLanguage.set(lang);
    localStorage.setItem('janus-lang', lang);
  }
}
