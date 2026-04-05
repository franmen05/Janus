import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

const API = 'http://localhost:8080/api';
const AUTH = 'Basic ' + btoa('admin:admin123');
const HEADERS = { 'Content-Type': 'application/json', 'Authorization': AUTH };

/** Create a fresh operation and advance it to SUBMITTED_TO_CUSTOMS via API. */
async function createOperationAtSubmittedToCustoms(request: import('@playwright/test').APIRequestContext): Promise<number> {
  // 1. Create operation
  const opRes = await request.post(`${API}/operations`, {
    headers: HEADERS,
    data: {
      clientId: 1,
      operationType: 'IMPORT',
      transportMode: 'AIR',
      operationCategory: 'CATEGORY_1',
      blNumber: 'BL-E2E-FINAL-VAL',
      estimatedArrival: '2025-12-01T10:00:00',
      blAvailability: 'ORIGINAL'
    }
  });
  expect(opRes.ok(), `Create operation failed: ${await opRes.text()}`).toBeTruthy();
  const opId = (await opRes.json()).id;

  // 2. Upload mandatory documents
  for (const docType of ['BL', 'COMMERCIAL_INVOICE', 'PACKING_LIST']) {
    const res = await request.post(`${API}/operations/${opId}/documents`, {
      headers: { 'Authorization': AUTH },
      multipart: {
        file: { name: 'test.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') },
        documentType: docType
      }
    });
    expect(res.ok(), `Upload ${docType} failed: ${await res.text()}`).toBeTruthy();
  }

  // 3. Register preliminary declaration
  const prelimRes = await request.post(`${API}/operations/${opId}/declarations/preliminary`, {
    headers: HEADERS,
    data: {
      declarationNumber: 'PRELIM-E2E',
      fobValue: 5000.00,
      cifValue: 6000.00,
      taxableBase: 6000.00,
      totalTaxes: 900.00,
      freightValue: 800.00,
      insuranceValue: 200.00,
      gattMethod: 'Transaction Value'
    }
  });
  expect(prelimRes.ok(), `Register preliminary failed: ${await prelimRes.text()}`).toBeTruthy();
  const declId = (await prelimRes.json()).id;

  // 4. Approve technically
  const techRes = await request.post(`${API}/operations/${opId}/declarations/${declId}/approve-technical`, {
    headers: HEADERS,
    data: { comment: 'Technical OK' }
  });
  expect(techRes.ok(), `Technical approve failed: ${await techRes.text()}`).toBeTruthy();

  // 5. Advance statuses
  for (const status of ['DOCUMENTATION_COMPLETE', 'IN_REVIEW', 'PRELIQUIDATION_REVIEW']) {
    const res = await request.post(`${API}/operations/${opId}/change-status`, {
      headers: HEADERS,
      data: { newStatus: status }
    });
    expect(res.ok(), `Change to ${status} failed: ${await res.text()}`).toBeTruthy();
  }

  // 6. Final approve (auto-advances from PRELIQUIDATION_REVIEW to DECLARATION_IN_PROGRESS)
  const finalApproveRes = await request.post(`${API}/operations/${opId}/declarations/${declId}/approve-final`, {
    headers: HEADERS,
    data: { comment: 'Final OK' }
  });
  expect(finalApproveRes.ok(), `Final approve failed: ${await finalApproveRes.text()}`).toBeTruthy();

  // 7. Advance to SUBMITTED_TO_CUSTOMS
  const advRes = await request.post(`${API}/operations/${opId}/change-status`, {
    headers: HEADERS,
    data: { newStatus: 'SUBMITTED_TO_CUSTOMS' }
  });
  expect(advRes.ok(), `Change to SUBMITTED_TO_CUSTOMS failed: ${await advRes.text()}`).toBeTruthy();

  return opId;
}

test.describe('FINAL declaration - required fields validation', () => {
  test.describe.configure({ mode: 'serial' });

  let operationId: number;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    operationId = await createOperationAtSubmittedToCustoms(page.request);
    console.log(`Created operation ${operationId} at SUBMITTED_TO_CUSTOMS`);
    await page.close();
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should show error when submitting without declarationNumber and gattMethod', async ({ page }) => {
    await page.goto(`/operations/${operationId}/declarations/new?type=FINAL`);
    await page.waitForSelector('form');

    // Fill only monetary values
    await page.fill('input[formcontrolname="fobValue"]', '5000');
    await page.fill('input[formcontrolname="freightValue"]', '200');
    await page.fill('input[formcontrolname="totalTaxes"]', '500');

    // Submit without declarationNumber and gattMethod
    await page.click('button.btn-primary');

    // Expect error toast
    const toast = page.locator('ngb-toast.bg-danger');
    await expect(toast).toBeVisible({ timeout: 5000 });

    // Should remain on the form
    expect(page.url()).toContain('/declarations/new');
  });

  test('should show error when submitting with declarationNumber but no gattMethod', async ({ page }) => {
    await page.goto(`/operations/${operationId}/declarations/new?type=FINAL`);
    await page.waitForSelector('form');

    await page.fill('input[formcontrolname="declarationNumber"]', 'DUA-FINAL-001');
    await page.fill('input[formcontrolname="fobValue"]', '5000');
    await page.fill('input[formcontrolname="freightValue"]', '200');
    await page.fill('input[formcontrolname="totalTaxes"]', '500');

    await page.click('button.btn-primary');

    // Expect error toast for GATT_METHOD_REQUIRED
    const toast = page.locator('ngb-toast.bg-danger');
    await expect(toast).toBeVisible({ timeout: 5000 });

    // Should remain on the form
    expect(page.url()).toContain('/declarations/new');
  });

  test('should succeed when submitting with both declarationNumber and gattMethod', async ({ page }) => {
    await page.goto(`/operations/${operationId}/declarations/new?type=FINAL`);
    await page.waitForSelector('form');

    await page.fill('input[formcontrolname="declarationNumber"]', 'DUA-FINAL-002');
    await page.fill('input[formcontrolname="gattMethod"]', 'Transaction Value');
    await page.fill('input[formcontrolname="fobValue"]', '5000');
    await page.fill('input[formcontrolname="freightValue"]', '200');
    await page.fill('input[formcontrolname="totalTaxes"]', '500');

    await page.click('button.btn-primary');

    // Should navigate to declaration detail on success (URL with numeric ID, not "new")
    await page.waitForURL(/\/operations\/\d+\/declarations\/\d+$/, { timeout: 10000 });
  });
});
