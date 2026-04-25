import { TranslateService } from '@ngx-translate/core';

export function getErrorMessage(err: any, translate: TranslateService): string {
  const errorCode = err.error?.errorCode;
  const backendMessage: string | undefined = err.error?.error || err.error?.message;
  if (errorCode) {
    const key = 'ERRORS.' + errorCode;
    const translated = translate.instant(key);
    if (translated !== key) {
      const colonIdx = backendMessage?.indexOf(':') ?? -1;
      const detail = colonIdx >= 0 ? backendMessage!.substring(colonIdx + 1).trim() : '';
      return detail ? `${translated} ${detail}` : translated;
    }
  }
  return backendMessage || translate.instant('ERRORS.GENERIC_ERROR');
}
