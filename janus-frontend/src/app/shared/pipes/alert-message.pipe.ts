import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Alert } from '../../core/models/alert.model';

@Pipe({
  name: 'alertMessage',
  standalone: true
})
export class AlertMessagePipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(alert: Alert): string {
    if (alert.messageParams) {
      try {
        const params = JSON.parse(alert.messageParams);
        const key = `ALERTS.MESSAGES.${alert.alertType}`;
        const translated = this.translate.instant(key, params);
        // If the key is not found, instant() returns the key itself
        if (translated !== key) {
          return translated;
        }
      } catch (e) {
        // Parse error, fall back
      }
    }
    return alert.message;
  }
}
