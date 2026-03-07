import { TranslateService } from '@ngx-translate/core';

export function getErrorMessage(err: any, translate: TranslateService): string {
  const errorCode = err.error?.errorCode;
  if (errorCode) {
    const key = 'ERRORS.' + errorCode;
    const translated = translate.instant(key);
    if (translated !== key) return translated;
  }
  return err.error?.error || err.error?.message || translate.instant('ERRORS.GENERIC_ERROR');
}
