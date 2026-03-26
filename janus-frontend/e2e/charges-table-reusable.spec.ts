import { test, expect, Page } from '@playwright/test';
import { login } from './helpers/auth';

const API = 'http://localhost:8080/api';
const AUTH = 'Basic ' + Buffer.from('admin:admin123').toString('base64');
const HEADERS = { 'Content-Type': 'application/json', 'Authorization': AUTH };

test.describe('Charges Table Reusable Component', () => {
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
        blNumber: 'BL-E2E-CHARGES',
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
        declarationNumber: 'PRELIM-E2E-CHG',
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

    // 6. Final approve
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

    // 8. Set inspection type
    const inspRes = await page.request.post(`${API}/operations/${operationId}/inspection/type`, {
      headers: HEADERS,
      data: { inspectionType: 'VISUAL', comment: 'test' }
    });
    expect(inspRes.ok(), `Set inspection type failed: ${await inspRes.text()}`).toBeTruthy();

    // 9. Add 1 expense charge (TRANSPORT, 500)
    const expense1Res = await page.request.post(`${API}/operations/${operationId}/inspection/expenses`, {
      headers: HEADERS,
      data: { chargeType: 'EXPENSE', category: 'TRANSPORT', quantity: 1, rate: 500, amount: 500 }
    });
    expect(expense1Res.ok(), `Add expense failed: ${await expense1Res.text()}`).toBeTruthy();

    // 10. Add 1 income charge (TRANSPORT, 1000)
    const income1Res = await page.request.post(`${API}/operations/${operationId}/inspection/expenses`, {
      headers: HEADERS,
      data: { chargeType: 'INCOME', category: 'TRANSPORT', quantity: 1, rate: 1000, amount: 1000 }
    });
    expect(income1Res.ok(), `Add income failed: ${await income1Res.text()}`).toBeTruthy();

    // 11. Advance to VALUATION_REVIEW
    {
      const res = await page.request.post(`${API}/operations/${operationId}/change-status`, {
        headers: HEADERS,
        data: { newStatus: 'VALUATION_REVIEW' }
      });
      expect(res.ok(), `Change to VALUATION_REVIEW failed: ${await res.text()}`).toBeTruthy();
    }

    // 12. Register final declaration
    const finalDeclRes = await page.request.post(`${API}/operations/${operationId}/declarations/final`, {
      headers: HEADERS,
      data: {
        declarationNumber: 'DUA-FINAL-E2E-CHG',
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

    // 13. Execute crossing
    const crossingRes = await page.request.post(`${API}/operations/${operationId}/declarations/crossing/execute`, {
      headers: HEADERS
    });
    expect(crossingRes.ok(), `Execute crossing failed: ${await crossingRes.text()}`).toBeTruthy();

    // 14. Advance to PAYMENT_PREPARATION
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

  // ---- Test 1: Charges table visible in Inspection tab ----
  test('should show charges table in Inspection tab', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');

    const inspectionTab = page.locator('button[ngbNavLink]').filter({ hasText: /Inspection|Inspecci/ });
    await expect(inspectionTab).toBeVisible();
    await inspectionTab.click();
    await page.waitForLoadState('networkidle');

    // Verify charges heading is visible inside app-charges-table
    const chargesHeading = page.locator('app-charges-table').locator('text=/Charges|Cargos/');
    await expect(chargesHeading).toBeVisible({ timeout: 5000 });

    // Verify Income and Expense tabs exist
    const incomeTab = page.locator('app-charges-table .nav-tabs .nav-link').filter({ hasText: /Income|Ingreso/ });
    const expenseTab = page.locator('app-charges-table .nav-tabs .nav-link').filter({ hasText: /Expense|Gasto/ });
    await expect(incomeTab).toBeVisible();
    await expect(expenseTab).toBeVisible();
  });

  // ---- Test 2: Charges table visible in Payment tab ----
  test('should show charges table in Payment tab', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');

    const paymentTab = page.locator('button[ngbNavLink]').filter({ hasText: /Payment|Pago/ });
    await expect(paymentTab).toBeVisible();
    await paymentTab.click();
    await page.waitForLoadState('networkidle');

    // Verify charges heading is visible inside the payment panel's app-charges-table
    const chargesHeading = page.locator('app-payment-panel app-charges-table').locator('text=/Charges|Cargos/');
    await expect(chargesHeading).toBeVisible({ timeout: 5000 });

    // Verify Income and Expense tabs exist within the charges table
    const incomeTab = page.locator('app-payment-panel app-charges-table .nav-tabs .nav-link').filter({ hasText: /Income|Ingreso/ });
    const expenseTab = page.locator('app-payment-panel app-charges-table .nav-tabs .nav-link').filter({ hasText: /Expense|Gasto/ });
    await expect(incomeTab).toBeVisible();
    await expect(expenseTab).toBeVisible();
  });

  // ---- Test 3: Existing charges appear in Inspection tab ----
  test('should show existing charges in Inspection tab', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');

    const inspectionTab = page.locator('button[ngbNavLink]').filter({ hasText: /Inspection|Inspecci/ });
    await inspectionTab.click();
    await page.waitForLoadState('networkidle');

    // Click Expense tab in the charges table
    const expenseTab = page.locator('app-charges-table .nav-tabs .nav-link').filter({ hasText: /Expense|Gasto/ });
    await expenseTab.click();
    await page.waitForTimeout(500);

    // Verify at least 1 row in the table
    const rows = page.locator('app-charges-table table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 5000 });
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  // ---- Test 4: Add charge from Payment tab via modal ----
  test('should add charge from Payment tab via modal', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');

    const paymentTab = page.locator('button[ngbNavLink]').filter({ hasText: /Payment|Pago/ });
    await paymentTab.click();
    await page.waitForLoadState('networkidle');

    // Click "Add Charge" button within the payment panel's charges table
    const addBtn = page.locator('app-payment-panel app-charges-table button').filter({ hasText: /Add Charge|Agregar Cargo/ });
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();

    // Wait for modal to open
    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Select EXPENSE tab in modal (should be default, but click to be sure)
    const expenseTabInModal = modal.locator('button[ngbNavLink]').filter({ hasText: /Expense|Gasto/ });
    await expenseTabInModal.click();
    await page.waitForTimeout(300);

    // Select category (first non-disabled option)
    const categorySelect = modal.locator('select[formcontrolname="category"]');
    await expect(categorySelect).toBeVisible();
    // Wait for categories to load (non-disabled options appear)
    await page.waitForTimeout(1000);
    const options = categorySelect.locator('option:not([disabled])');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);
    // Select the first available category
    const firstOptionValue = await options.first().getAttribute('value');
    await categorySelect.selectOption(firstOptionValue!);

    // Set quantity to 2
    const quantityInput = modal.locator('input[formcontrolname="quantity"]');
    await quantityInput.fill('2');

    // Set rate to 150
    const rateInput = modal.locator('input[formcontrolname="rate"]');
    await rateInput.fill('150');
    await page.waitForTimeout(300);

    // Verify amount auto-filled to 300
    const amountInput = modal.locator('input[formcontrolname="amount"]');
    const amountValue = await amountInput.inputValue();
    expect(parseFloat(amountValue)).toBe(300);

    // Click "Save & Add" button
    const saveAddBtn = modal.locator('.modal-footer button.btn-primary').filter({ hasText: /Save|Guardar/ });
    await saveAddBtn.click();
    await page.waitForTimeout(1500);

    // Modal reopens for next charge — close it
    const reopenedModal = page.locator('.modal-content');
    if (await reopenedModal.isVisible()) {
      await page.locator('.btn-close').click();
      await page.waitForSelector('.modal-content', { state: 'hidden', timeout: 5000 });
    }

    // Verify the new charge appears in the expense table
    await page.waitForTimeout(500);
    const expenseTab = page.locator('app-payment-panel app-charges-table .nav-tabs .nav-link').filter({ hasText: /Expense|Gasto/ });
    await expenseTab.click();
    await page.waitForTimeout(500);

    const rows = page.locator('app-payment-panel app-charges-table table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 5000 });
    const rowCount = await rows.count();
    // Should have at least 2 expense rows now (original 500 + new 300)
    expect(rowCount).toBeGreaterThanOrEqual(2);
  });

  // ---- Test 5: Cross-reference updates after adding charge ----
  test('should update cross-reference after adding charge from Payment tab', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');

    const paymentTab = page.locator('button[ngbNavLink]').filter({ hasText: /Payment|Pago/ });
    await paymentTab.click();
    await page.waitForLoadState('networkidle');

    // Cross-reference summary cards should reflect updated expense total
    const summaryCards = page.locator('app-payment-panel .card.border .card-body.py-2.text-center');
    await expect(summaryCards.first()).toBeVisible({ timeout: 5000 });
    const cardCount = await summaryCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);

    // Expense total should be > 500 (original 500 + newly added 300)
    const expenseCard = page.locator('app-payment-panel .card.border .card-body.py-2.text-center strong.text-danger').first();
    await expect(expenseCard).toBeVisible({ timeout: 5000 });
    const expenseText = await expenseCard.textContent();
    const expenseValue = parseFloat(expenseText!.replace(/,/g, ''));
    expect(expenseValue).toBeGreaterThan(500);
  });

  // ---- Test 6: Switch Income/Expense tabs in both locations ----
  test('should switch Income/Expense tabs in both locations', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');

    // --- Payment tab ---
    const paymentTab = page.locator('button[ngbNavLink]').filter({ hasText: /Payment|Pago/ });
    await paymentTab.click();
    await page.waitForLoadState('networkidle');

    // Click Income tab in charges table
    const paymentIncomeTab = page.locator('app-payment-panel app-charges-table .nav-tabs .nav-link').filter({ hasText: /Income|Ingreso/ });
    await paymentIncomeTab.click();
    await page.waitForTimeout(500);

    // Income total badge should be visible
    const incomeBadge = page.locator('app-payment-panel app-charges-table .nav-tabs .nav-link.active .badge');
    await expect(incomeBadge).toBeVisible();

    // Click Expense tab
    const paymentExpenseTab = page.locator('app-payment-panel app-charges-table .nav-tabs .nav-link').filter({ hasText: /Expense|Gasto/ });
    await paymentExpenseTab.click();
    await page.waitForTimeout(500);

    // Expense total badge should be visible
    const expenseBadge = page.locator('app-payment-panel app-charges-table .nav-tabs .nav-link.active .badge');
    await expect(expenseBadge).toBeVisible();

    // --- Inspection tab ---
    const inspectionTab = page.locator('button[ngbNavLink]').filter({ hasText: /Inspection|Inspecci/ });
    await inspectionTab.click();
    await page.waitForLoadState('networkidle');

    // Click Income tab
    const inspIncomeTab = page.locator('app-charges-table .nav-tabs .nav-link').filter({ hasText: /Income|Ingreso/ }).first();
    await inspIncomeTab.click();
    await page.waitForTimeout(500);

    const inspIncomeBadge = page.locator('app-charges-table .nav-tabs .nav-link.active .badge').first();
    await expect(inspIncomeBadge).toBeVisible();

    // Click Expense tab
    const inspExpenseTab = page.locator('app-charges-table .nav-tabs .nav-link').filter({ hasText: /Expense|Gasto/ }).first();
    await inspExpenseTab.click();
    await page.waitForTimeout(500);

    const inspExpenseBadge = page.locator('app-charges-table .nav-tabs .nav-link.active .badge').first();
    await expect(inspExpenseBadge).toBeVisible();
  });

  // ---- Test 7: Delete charge from Payment tab ----
  test('should delete charge from Payment tab', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');

    const paymentTab = page.locator('button[ngbNavLink]').filter({ hasText: /Payment|Pago/ });
    await paymentTab.click();
    await page.waitForLoadState('networkidle');

    // Click Expense tab in charges table
    const expenseTab = page.locator('app-payment-panel app-charges-table .nav-tabs .nav-link').filter({ hasText: /Expense|Gasto/ });
    await expenseTab.click();
    await page.waitForTimeout(500);

    // Count rows before delete
    const rows = page.locator('app-payment-panel app-charges-table table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 5000 });
    const rowCountBefore = await rows.count();

    // Click delete button (bi-trash) on the last row
    const deleteBtn = page.locator('app-payment-panel app-charges-table table tbody tr').last().locator('button.btn-outline-danger');
    await expect(deleteBtn).toBeVisible();

    // Handle the confirm dialog
    page.once('dialog', async dialog => {
      await dialog.accept();
    });

    await deleteBtn.click();
    await page.waitForTimeout(2000);

    // Verify row count decreased
    const rowCountAfter = await page.locator('app-payment-panel app-charges-table table tbody tr').count();
    expect(rowCountAfter).toBeLessThan(rowCountBefore);
  });
});
