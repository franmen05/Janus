import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  private labels: Record<string, string> = {
    'DRAFT': 'Draft',
    'DOCUMENTATION_COMPLETE': 'Documentation Complete',
    'DECLARATION_IN_PROGRESS': 'Declaration in Progress',
    'SUBMITTED_TO_CUSTOMS': 'Submitted to Customs',
    'VALUATION_REVIEW': 'Valuation Review',
    'PAYMENT_PREPARATION': 'Payment Preparation',
    'IN_TRANSIT': 'In Transit',
    'CLOSED': 'Closed',
    'CANCELLED': 'Cancelled',
    'BL': 'Bill of Lading',
    'COMMERCIAL_INVOICE': 'Commercial Invoice',
    'PACKING_LIST': 'Packing List',
    'CERTIFICATE': 'Certificate',
    'OTHER': 'Other',
    'FCL': 'Full Container Load',
    'LCL': 'Less than Container Load',
    'EXPRESS': 'Express',
    'VISUAL': 'Visual',
    'PHYSICAL': 'Physical'
  };

  transform(value: string): string {
    return this.labels[value] ?? value;
  }
}
