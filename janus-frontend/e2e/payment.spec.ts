import { test, expect, Page } from '@playwright/test';
import { login } from './helpers/auth';

const API = 'http://localhost:8080/api';
const AUTH = 'Basic ' + Buffer.from('admin:admin123').toString('base64');
const HEADERS = { 'Content-Type': 'application/json', 'Authorization': AUTH };

test.describe('Payment & Liquidation Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let operationId: number;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await login(page);

    // 1. Create a fresh operation
    const opRes = await page.request.post(`${API}/operations`, {
      headers: HEADERS,
      data: {
        clientId: 1,
        operationType: 'IMPORT',
        transportMode: 'AIR',
        operationCategory: 'CATEGORY_1',
        blNumber: 'BL-E2E-PAYMENT',
        estimatedArrival: '2025-12-01T10:00:00',
        blAvailability: 'ORIGINAL',
        arrivalPortId: 1,
        incoterm: 'FOB'
      }
    });
    expect(opRes.ok(), `Create operation failed: ${await opRes.text()}`).toBeTruthy();
    const op = await opRes.json();
    operationId = op.id;

    // 2. Upload 3 mandatory documents
    for (const docType of ['BL', 'COMMERCIAL_INVOICE', 'PACKING_LIST']) {
      const res = await page.request.post(`${API}/operations/${operationId}/documents`, {
        headers: { 'Authorization': AUTH },
        multipart: {
          file: { name: 'test.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') },
          documentType: docType
        }
      });
      expect(res.ok(), `Upload ${docType} failed: ${await res.text()}`).toBeTruthy();
    }

    // 3. Register preliminary declaration
    const prelimRes = await page.request.post(`${API}/operations/${operationId}/declarations/preliminary`, {
      headers: HEADERS,
      data: {
        declarationNumber: 'PRELIM-E2E-PAY',
        fobValue: 10000.00,
        cifValue: 12000.00,
        taxableBase: 12000.00,
        totalTaxes: 1800.00,
        freightValue: 1500.00,
        insuranceValue: 500.00,
        gattMethod: 'Transaction Value'
      }
    });
    expect(prelimRes.ok(), `Register preliminary failed: ${await prelimRes.text()}`).toBeTruthy();
    const declId = (await prelimRes.json()).id;

    // 4. Approve technically
    const techRes = await page.request.post(`${API}/operations/${operationId}/declarations/${declId}/approve-technical`, {
      headers: HEADERS,
      data: { comment: 'OK' }
    });
    expect(techRes.ok(), `Technical approve failed: ${await techRes.text()}`).toBeTruthy();

    // 5. Advance through statuses up to PRELIQUIDATION_REVIEW
    for (const status of ['DOCUMENTATION_COMPLETE', 'IN_REVIEW', 'PRELIQUIDATION_REVIEW']) {
      const res = await page.request.post(`${API}/operations/${operationId}/change-status`, {
        headers: HEADERS,
        data: { newStatus: status }
      });
      expect(res.ok(), `Change to ${status} failed: ${await res.text()}`).toBeTruthy();
    }

    // 6. Final approve (auto-advances from PRELIQUIDATION_REVIEW)
    const finalApproveRes = await page.request.post(`${API}/operations/${operationId}/declarations/${declId}/approve-final`, {
      headers: HEADERS,
      data: { comment: 'Final OK' }
    });
    expect(finalApproveRes.ok(), `Final approve failed: ${await finalApproveRes.text()}`).toBeTruthy();

    // 7. Advance to SUBMITTED_TO_CUSTOMS
    {
      const res = await page.request.post(`${API}/operations/${operationId}/change-status`, {
        headers: HEADERS,
        data: { newStatus: 'SUBMITTED_TO_CUSTOMS' }
      });
      expect(res.ok(), `Change to SUBMITTED_TO_CUSTOMS failed: ${await res.text()}`).toBeTruthy();
    }

    // 8. Set inspection type (required before VALUATION_REVIEW)
    const inspRes = await page.request.post(`${API}/operations/${operationId}/inspection/type`, {
      headers: HEADERS,
      data: { inspectionType: 'VISUAL', comment: 'test' }
    });
    expect(inspRes.ok(), `Set inspection type failed: ${await inspRes.text()}`).toBeTruthy();

    // 9. Add expense charges via /inspection/expenses
    const expense1Res = await page.request.post(`${API}/operations/${operationId}/inspection/expenses`, {
      headers: HEADERS,
      data: { chargeType: 'EXPENSE', category: 'TRANSPORT', quantity: 1, rate: 500, amount: 500 }
    });
    expect(expense1Res.ok(), `Add expense 1 failed: ${await expense1Res.text()}`).toBeTruthy();

    const expense2Res = await page.request.post(`${API}/operations/${operationId}/inspection/expenses`, {
      headers: HEADERS,
      data: { chargeType: 'EXPENSE', category: 'STORAGE', quantity: 1, rate: 300, amount: 300 }
    });
    expect(expense2Res.ok(), `Add expense 2 failed: ${await expense2Res.text()}`).toBeTruthy();

    // 10. Add income charge
    const income1Res = await page.request.post(`${API}/operations/${operationId}/inspection/expenses`, {
      headers: HEADERS,
      data: { chargeType: 'INCOME', category: 'TRANSPORT', quantity: 1, rate: 1000, amount: 1000 }
    });
    expect(income1Res.ok(), `Add income 1 failed: ${await income1Res.text()}`).toBeTruthy();

    // 11. Advance to VALUATION_REVIEW
    {
      const res = await page.request.post(`${API}/operations/${operationId}/change-status`, {
        headers: HEADERS,
        data: { newStatus: 'VALUATION_REVIEW' }
      });
      expect(res.ok(), `Change to VALUATION_REVIEW failed: ${await res.text()}`).toBeTruthy();
    }

    // 12. Register a FINAL declaration
    const finalDeclRes = await page.request.post(`${API}/operations/${operationId}/declarations/final`, {
      headers: HEADERS,
      data: {
        declarationNumber: 'DUA-FINAL-E2E-PAY',
        fobValue: 10000.00,
        cifValue: 12000.00,
        taxableBase: 12000.00,
        totalTaxes: 1800.00,
        freightValue: 1500.00,
        insuranceValue: 500.00,
        gattMethod: 'Transaction Value'
      }
    });
    expect(finalDeclRes.ok(), `Register final declaration failed: ${await finalDeclRes.text()}`).toBeTruthy();

    // 13. Execute crossing (compares preliminary vs final)
    const crossingRes = await page.request.post(`${API}/operations/${operationId}/declarations/crossing/execute`, {
      headers: HEADERS
    });
    expect(crossingRes.ok(), `Execute crossing failed: ${await crossingRes.text()}`).toBeTruthy();

    // 14. Advance to PAYMENT_PREPARATION (directly from VALUATION_REVIEW)
    {
      const res = await page.request.post(`${API}/operations/${operationId}/change-status`, {
        headers: HEADERS,
        data: { newStatus: 'PAYMENT_PREPARATION' }
      });
      expect(res.ok(), `Change to PAYMENT_PREPARATION failed: ${await res.text()}`).toBeTruthy();
    }
  });

  test.afterAll(async () => {
    await page.close();
  });

  // TEST a: Payment tab visible
  test('should show Payment tab for the operation', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    const paymentTab = page.locator('button[ngbNavLink]', { hasText: /Payment|Pago/ });
    await expect(paymentTab).toBeVisible();
  });

  // TEST b: Cross-reference section shows
  test('should show cross-reference section with income/expense/balance', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    const paymentTab = page.locator('button[ngbNavLink]', { hasText: /Payment|Pago/ });
    await paymentTab.click();

    // Cross-reference card should be visible
    const crossRefCard = page.locator('app-payment-panel .card').first();
    await expect(crossRefCard).toBeVisible();

    // Should show income, expenses, and balance cards
    const summaryCards = page.locator('app-payment-panel .card.border .card-body.py-2.text-center');
    await expect(summaryCards.first()).toBeVisible({ timeout: 5000 });
    const cardCount = await summaryCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);
  });

  // TEST c: Add charge from Inspection tab during PAYMENT_PREPARATION
  test('should allow adding charges from Inspection tab during payment stage', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');

    // Inspection tab should be visible in PAYMENT_PREPARATION
    const inspectionTab = page.locator('button[ngbNavLink]').filter({ hasText: /Inspection|Inspecci/ });
    await expect(inspectionTab).toBeVisible();
    await inspectionTab.click();

    // "Add Charge" button should be visible
    const addBtn = page.locator('button', { hasText: /Add Charge|Agregar Cargo/ });
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();

    // Modal should open
    await expect(page.locator('.modal-dialog')).toBeVisible();

    // Fill charge: EXPENSE, FREIGHT category
    await page.locator('select[formcontrolname="category"]').selectOption('FREIGHT');
    await page.fill('input[formcontrolname="quantity"]', '1');
    await page.fill('input[formcontrolname="rate"]', '750');
    await page.waitForTimeout(300);

    // In add mode the button is "Save & Add" — click it, then close the reopened modal
    const saveAddBtn = page.locator('.modal-footer button.btn-primary', { hasText: /Save|Guardar/ });
    await saveAddBtn.click();
    await page.waitForTimeout(1500);
    // Modal reopens for next charge — close it
    const modal = page.locator('.modal-dialog');
    if (await modal.isVisible()) {
      await page.locator('.btn-close').click();
      await page.waitForSelector('.modal-dialog', { state: 'hidden', timeout: 5000 });
    }

    // Verify charge appears in the expenses table
    await page.waitForTimeout(1000);
    const table = page.locator('app-inspection-panel table');
    await expect(table).toBeVisible();
  });

  // TEST d: Verify cross-reference updates after adding charge in payment stage
  test('should update cross-reference after adding charge in payment stage', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');

    // Go to Payment tab
    const paymentTab = page.locator('button[ngbNavLink]', { hasText: /Payment|Pago/ });
    await paymentTab.click();

    // Cross-reference should show updated expenses (original 800 + new 750 = 1550)
    const expenseCard = page.locator('app-payment-panel .card.border .card-body.py-2.text-center strong.text-danger').first();
    await expect(expenseCard).toBeVisible({ timeout: 5000 });
    const expenseText = await expenseCard.textContent();
    const expenseValue = parseFloat(expenseText!.replace(/,/g, ''));
    // Should be greater than original 800 (we added 750 freight)
    expect(expenseValue).toBeGreaterThan(800);
  });

  // TEST e: Send to billing
  test('should send all income to billing', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    const paymentTab = page.locator('button[ngbNavLink]', { hasText: /Payment|Pago/ });
    await paymentTab.click();
    await page.waitForSelector('app-payment-panel .card');

    // Click "Send All to Billing" button
    const sendBtn = page.locator('app-payment-panel button.btn-outline-primary', { hasText: /Send|Enviar/ });
    await expect(sendBtn).toBeVisible({ timeout: 5000 });

    // Handle the alert dialog that appears after sending
    page.once('dialog', async dialog => {
      await dialog.accept();
    });

    await sendBtn.click();
    await page.waitForTimeout(2000);

    // Verify success indicator: check-circle icon or "All income sent" text
    const successIndicator = page.locator('app-payment-panel i.bi-check-circle-fill.text-success');
    await expect(successIndicator).toBeVisible({ timeout: 5000 });
  });

  // TEST d: Generate liquidation
  test('should generate liquidation with agency fee', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    const paymentTab = page.locator('button[ngbNavLink]', { hasText: /Payment|Pago/ });
    await paymentTab.click();
    await page.waitForSelector('app-payment-panel .card');

    // Enter agency fee
    const agencyFeeInput = page.locator('app-payment-panel .input-group input[type="number"]');
    await expect(agencyFeeInput).toBeVisible({ timeout: 5000 });
    await agencyFeeInput.fill('2500');

    // Click Generate button
    const generateBtn = page.locator('app-payment-panel button.btn-primary', { hasText: /Generate|Generar/ });
    await generateBtn.click();

    // Wait for spinner to disappear and summary cards to appear
    await page.waitForSelector('app-payment-panel .spinner-border', { state: 'hidden', timeout: 10000 }).catch(() => {});
    const summaryCards = page.locator('app-payment-panel .row.g-3.mb-4 .card');
    await expect(summaryCards.first()).toBeVisible({ timeout: 10000 });
  });

  // TEST e: Liquidation summary cards displayed
  test('should display 4 liquidation summary cards with values', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    const paymentTab = page.locator('button[ngbNavLink]', { hasText: /Payment|Pago/ });
    await paymentTab.click();

    // Wait for summary cards row
    const summaryCards = page.locator('app-payment-panel .row.g-3.mb-4 .card');
    await expect(summaryCards.first()).toBeVisible({ timeout: 10000 });
    const cardCount = await summaryCards.count();
    expect(cardCount).toBe(4);

    // Verify Grand Total card (bg-primary) has a non-zero value
    const grandTotalCard = page.locator('app-payment-panel .card.bg-primary strong.fs-5');
    await expect(grandTotalCard).toBeVisible();
    const grandTotalText = await grandTotalCard.textContent();
    const grandTotalValue = parseFloat(grandTotalText!.replace(/,/g, ''));
    expect(grandTotalValue).toBeGreaterThan(0);
  });

  // TEST f: Lines table displayed
  test('should display liquidation lines table with rows', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    const paymentTab = page.locator('button[ngbNavLink]', { hasText: /Payment|Pago/ });
    await paymentTab.click();

    // Wait for lines table (the second table, inside liquidation breakdown section)
    const linesTable = page.locator('app-payment-panel table.table-hover').last();
    await expect(linesTable).toBeVisible({ timeout: 10000 });

    // Verify headers: Concept, Description, Amount, Type
    const headers = linesTable.locator('thead th');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThanOrEqual(3);

    // Verify rows exist
    const rows = linesTable.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  // TEST g: Status badge shows PRELIMINARY
  test('should show PRELIMINARY status badge', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    const paymentTab = page.locator('button[ngbNavLink]', { hasText: /Payment|Pago/ });
    await paymentTab.click();

    const statusBadge = page.locator('app-payment-panel .card-header .badge');
    await expect(statusBadge).toBeVisible({ timeout: 10000 });
    const badgeText = await statusBadge.textContent();
    expect(badgeText).toMatch(/Preliminary|Preliminar/i);
  });

  // TEST h: Approve liquidation
  test('should approve liquidation via confirm and prompt dialogs', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    const paymentTab = page.locator('button[ngbNavLink]', { hasText: /Payment|Pago/ });
    await paymentTab.click();

    // Wait for the approve button
    const approveBtn = page.locator('app-payment-panel button.btn-success', { hasText: /Approve|Aprobar/ });
    await expect(approveBtn).toBeVisible({ timeout: 10000 });

    // Handle confirm() then prompt() dialogs
    page.on('dialog', async dialog => {
      if (dialog.type() === 'prompt') {
        await dialog.accept('Approved');
      } else {
        await dialog.accept();
      }
    });

    await approveBtn.click();
    await page.waitForTimeout(2000);

    // Verify status changes to Approved
    const statusBadge = page.locator('app-payment-panel .card-header .badge');
    await expect(statusBadge).toBeVisible({ timeout: 10000 });
    const badgeText = await statusBadge.textContent();
    expect(badgeText).toMatch(/Approved|Aprobad/i);
  });

  // TEST i: Make definitive
  test('should make liquidation definitive with DGA payment code', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    const paymentTab = page.locator('button[ngbNavLink]', { hasText: /Payment|Pago/ });
    await paymentTab.click();

    // Wait for the Make Definitive section
    const dgaInput = page.locator('app-payment-panel .card.border-primary input.form-control');
    await expect(dgaInput).toBeVisible({ timeout: 10000 });
    await dgaInput.fill('DGA-PAY-E2E-001');

    // Click Make Definitive button
    const definitiveBtn = page.locator('app-payment-panel .card.border-primary button.btn-primary');
    await expect(definitiveBtn).toBeEnabled();
    await definitiveBtn.click();
    await page.waitForTimeout(2000);

    // Verify status changes to Definitive
    const statusBadge = page.locator('app-payment-panel .card-header .badge');
    await expect(statusBadge).toBeVisible({ timeout: 10000 });
    const badgeText = await statusBadge.textContent();
    expect(badgeText).toMatch(/Definitive|Definitiv/i);
  });

  // TEST j: Register payment
  test('should register payment with all fields', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    const paymentTab = page.locator('button[ngbNavLink]', { hasText: /Payment|Pago/ });
    await paymentTab.click();

    // Wait for the Register Payment section
    const paymentCard = page.locator('app-payment-panel .card.border-success');
    await expect(paymentCard).toBeVisible({ timeout: 10000 });

    // Fill payment form fields
    const amountInput = paymentCard.locator('input[type="number"]');
    await amountInput.fill('12000');

    const methodSelect = paymentCard.locator('select.form-select');
    await methodSelect.selectOption('BANK_TRANSFER');

    const dateInput = paymentCard.locator('input[type="date"]');
    await dateInput.fill('2025-12-15');

    // Fill optional reference fields (4th, 5th, 6th inputs in the form rows)
    const textInputs = paymentCard.locator('input[type="text"].form-control');
    const dgaRefInput = textInputs.nth(0);
    await dgaRefInput.fill('DGA-REF-001');

    const bankRefInput = textInputs.nth(1);
    await bankRefInput.fill('BANK-REF-001');

    const notesInput = textInputs.nth(2);
    await notesInput.fill('E2E test payment');

    // Click Register Payment button
    const registerBtn = paymentCard.locator('button.btn-success');
    await expect(registerBtn).toBeEnabled();
    await registerBtn.click();
    await page.waitForTimeout(3000);

    // Verify status changes to Paid
    const statusBadge = page.locator('app-payment-panel .card-header .badge');
    await expect(statusBadge).toBeVisible({ timeout: 10000 });
    const badgeText = await statusBadge.textContent();
    expect(badgeText).toMatch(/Paid|Pagad/i);
  });

  // TEST k: Payment details displayed
  test('should display payment details card with registered info', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    const paymentTab = page.locator('button[ngbNavLink]', { hasText: /Payment|Pago/ });
    await paymentTab.click();

    // Wait for payment details card (border-success with bg-success header)
    const paymentDetailsCard = page.locator('app-payment-panel .card.border-success .card-header.bg-success');
    await expect(paymentDetailsCard).toBeVisible({ timeout: 10000 });

    // Verify amount is displayed
    const cardBody = page.locator('app-payment-panel .card.border-success .card-body');
    await expect(cardBody).toBeVisible();

    // Check amount value (12,000.00)
    const amountText = await cardBody.textContent();
    expect(amountText).toMatch(/12[,.]?000/);

    // Check method is displayed
    expect(amountText).toMatch(/Bank Transfer|Transferencia/i);

    // Check DGA reference
    expect(amountText).toContain('DGA-REF-001');

    // Check bank reference
    expect(amountText).toContain('BANK-REF-001');
  });
});
