import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({ name: 'statusLabel', standalone: true, pure: false })
export class StatusLabelPipe implements PipeTransform {
  private translate = inject(TranslateService);

  private keyMap: Record<string, string> = {
    'DRAFT': 'STATUS.DRAFT',
    'DOCUMENTATION_COMPLETE': 'STATUS.DOCUMENTATION_COMPLETE',
    'DECLARATION_IN_PROGRESS': 'STATUS.DECLARATION_IN_PROGRESS',
    'SUBMITTED_TO_CUSTOMS': 'STATUS.SUBMITTED_TO_CUSTOMS',
    'VALUATION_REVIEW': 'STATUS.VALUATION_REVIEW',
    'PAYMENT_PREPARATION': 'STATUS.PAYMENT_PREPARATION',
    'IN_TRANSIT': 'STATUS.IN_TRANSIT',
    'CLOSED': 'STATUS.CLOSED',
    'CANCELLED': 'STATUS.CANCELLED',
    'BL': 'DOCUMENT_TYPES.BL',
    'COMMERCIAL_INVOICE': 'DOCUMENT_TYPES.COMMERCIAL_INVOICE',
    'PACKING_LIST': 'DOCUMENT_TYPES.PACKING_LIST',
    'CERTIFICATE': 'DOCUMENT_TYPES.CERTIFICATE',
    'OTHER': 'DOCUMENT_TYPES.OTHER',
    'FCL': 'CARGO_TYPES.FCL',
    'LCL': 'CARGO_TYPES.LCL',
    'EXPRESS': 'INSPECTION_TYPES.EXPRESS',
    'VISUAL': 'INSPECTION_TYPES.VISUAL',
    'PHYSICAL': 'INSPECTION_TYPES.PHYSICAL'
  };

  transform(value: string): string {
    const key = this.keyMap[value];
    return key ? this.translate.instant(key) : value;
  }
}
