import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageService } from './core/services/language.service';
import { ThemeService } from './core/services/theme.service';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  template: `<router-outlet /><app-toast-container />`
})
export class AppComponent {
  private languageService = inject(LanguageService);
  private themeService = inject(ThemeService);

  constructor() {
    this.languageService.init();
    this.themeService.init();
  }
}
