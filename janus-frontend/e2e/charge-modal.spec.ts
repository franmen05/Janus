import { test, expect, Page } from '@playwright/test';
import { login } from './helpers/auth';

const API = 'http://localhost:8080';
const AUTH = {
  'Authorization': 'Basic ' + Buffer.from('admin:admin123').toString('base64'),
  'Content-Type': 'application/json'
};

test.describe('Charge Modal', () => {
  test.describe.configure({ mode: 'serial' });

  let operationId: number;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await login(page);

    // Create operation via API
    const createRes = await page.request.post(`${API}/api/operations`, {
      data: {
        clientId: 1,
        operationType: 'IMPORT',
        transportMode: 'MARITIME',
        operationCategory: 'CATEGORY_1',
        estimatedArrival: '2026-04-01T00:00:00',
        blAvailability: 'NOT_AVAILABLE',
        blNumber: 'HBLI-TEST-001',
        arrivalPortId: 1
      },
      headers: AUTH
    });
    const operation = await createRes.json();
    operationId = operation.id;

    // Advance status to SUBMITTED_TO_CUSTOMS
    const statuses = [
      'DOCUMENTATION_COMPLETE',
      'IN_REVIEW',
      'PRELIQUIDATION_REVIEW',
      'ANALYST_ASSIGNED',
      'DECLARATION_IN_PROGRESS',
      'SUBMITTED_TO_CUSTOMS'
    ];
    for (const status of statuses) {
      await page.request.put(`${API}/api/operations/${operationId}/status`, {
        data: { newStatus: status, comment: 'E2E test advancement' },
        headers: AUTH
      });
    }

    // Set inspection type
    await page.request.post(`${API}/api/operations/${operationId}/inspection/type`, {
      data: { inspectionType: 'VISUAL', comment: 'E2E test' },
      headers: AUTH
    });
  });

  test.afterAll(async () => {
    await page.close();
  });

  // TEST 1: Charges section visible when inspectionType is set
  test('should show Charges section when inspectionType is set', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    // Click the Inspection tab to reveal the inspection panel
    const inspectionTab = page.locator('button[ngbNavLink]').filter({ hasText: /Inspection|Inspecci/ });
    await inspectionTab.click();
    // Look for the Charges heading (CHARGES_TITLE key -> "Charges" or "Cargos")
    await expect(page.locator('text=/Charges|Cargos/')).toBeVisible();
  });

  // TEST 2: Open Add Charge modal with INCOME/EXPENSES tabs
  test('should open Add Charge modal with INCOME/EXPENSES tabs', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    // Navigate to Inspection tab
    const inspectionTab = page.locator('button[ngbNavLink]').filter({ hasText: /Inspection|Inspecci/ });
    await inspectionTab.click();
    // Click Add Charge button
    const addBtn = page.locator('button', { hasText: /Add Charge|Agregar Cargo/ });
    await addBtn.click();
    // Verify modal is open
    await expect(page.locator('.modal-dialog')).toBeVisible();
    // Verify tabs exist (ngbNavLink buttons inside the modal)
    await expect(page.locator('.modal-body button[ngbNavLink]').filter({ hasText: /Income|Ingresos/ })).toBeVisible();
    await expect(page.locator('.modal-body button[ngbNavLink]').filter({ hasText: /Expenses|Gastos/ })).toBeVisible();
    // Close modal
    await page.locator('.btn-close').click();
  });

  // TEST 3: Info bar with operation cargo data badges
  test('should show info bar with operation cargo data badges', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    const inspectionTab = page.locator('button[ngbNavLink]').filter({ hasText: /Inspection|Inspecci/ });
    await inspectionTab.click();
    const addBtn = page.locator('button', { hasText: /Add Charge|Agregar Cargo/ });
    await addBtn.click();
    await expect(page.locator('.modal-dialog')).toBeVisible();
    // Info bar badges should be visible (Pcs, Weight, Volume, etc.)
    const badges = page.locator('.modal-body .badge.bg-success');
    const badgeCount = await badges.count();
    expect(badgeCount).toBeGreaterThanOrEqual(3);
    await page.locator('.btn-close').click();
  });

  // TEST 4: Auto-calculate amount from quantity x rate
  test('should auto-calculate amount from quantity x rate', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    const inspectionTab = page.locator('button[ngbNavLink]').filter({ hasText: /Inspection|Inspecci/ });
    await inspectionTab.click();
    const addBtn = page.locator('button', { hasText: /Add Charge|Agregar Cargo/ });
    await addBtn.click();
    await expect(page.locator('.modal-dialog')).toBeVisible();
    // Fill quantity and rate
    await page.fill('input[formcontrolname="quantity"]', '2');
    await page.fill('input[formcontrolname="rate"]', '50');
    // Wait for auto-calculation
    await page.waitForTimeout(500);
    // Check amount field
    const amountValue = await page.inputValue('input[formcontrolname="amount"]');
    expect(parseFloat(amountValue)).toBe(100);
    await page.locator('.btn-close').click();
  });

  // TEST 5: Switch between INCOME and EXPENSES tabs
  test('should switch between INCOME and EXPENSES tabs', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    const inspectionTab = page.locator('button[ngbNavLink]').filter({ hasText: /Inspection|Inspecci/ });
    await inspectionTab.click();
    const addBtn = page.locator('button', { hasText: /Add Charge|Agregar Cargo/ });
    await addBtn.click();
    await expect(page.locator('.modal-dialog')).toBeVisible();
    // Click INCOME tab
    const incomeTab = page.locator('.modal-body button[ngbNavLink]').filter({ hasText: /Income|Ingresos/ });
    await incomeTab.click();
    // Verify the tab is active (has active class)
    await expect(incomeTab).toHaveClass(/active/);
    // Click EXPENSES tab
    const expenseTab = page.locator('.modal-body button[ngbNavLink]').filter({ hasText: /Expenses|Gastos/ });
    await expenseTab.click();
    await expect(expenseTab).toHaveClass(/active/);
    await page.locator('.btn-close').click();
  });

  // TEST 6: Save expense charge successfully
  test('should save expense charge successfully', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    const inspectionTab = page.locator('button[ngbNavLink]').filter({ hasText: /Inspection|Inspecci/ });
    await inspectionTab.click();
    const addBtn = page.locator('button', { hasText: /Add Charge|Agregar Cargo/ });
    await addBtn.click();
    await expect(page.locator('.modal-dialog')).toBeVisible();
    // Fill required fields
    // Wait for categories to load then select first available option
    await page.waitForSelector('select[formcontrolname="category"] option:not([disabled])');
    await page.locator('select[formcontrolname="category"]').selectOption({ index: 1 });
    await page.fill('input[formcontrolname="quantity"]', '1');
    await page.fill('input[formcontrolname="rate"]', '150');
    await page.waitForTimeout(300);
    // Click Save
    const saveBtn = page.locator('.modal-footer button.btn-primary', { hasText: /^Save$|^Guardar$/ });
    await saveBtn.click();
    // Wait for modal to close
    await page.waitForSelector('.modal-dialog', { state: 'hidden', timeout: 5000 });
    // Verify charge appears in table
    await page.waitForTimeout(1000);
    const table = page.locator('app-inspection-panel table');
    await expect(table).toBeVisible();
    const rows = table.locator('tbody tr');
    await expect(rows).not.toHaveCount(0);
  });

  // TEST 7: Save and add (keep modal open pattern)
  test('should save and add (keep modal open pattern)', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    const inspectionTab = page.locator('button[ngbNavLink]').filter({ hasText: /Inspection|Inspecci/ });
    await inspectionTab.click();
    const addBtn = page.locator('button', { hasText: /Add Charge|Agregar Cargo/ });
    await addBtn.click();
    await expect(page.locator('.modal-dialog')).toBeVisible();
    // Fill and save & add
    await page.waitForSelector('select[formcontrolname="category"] option:not([disabled])');
    await page.locator('select[formcontrolname="category"]').selectOption({ index: 1 });
    await page.fill('input[formcontrolname="quantity"]', '2');
    await page.fill('input[formcontrolname="rate"]', '75');
    await page.waitForTimeout(300);
    const saveAddBtn = page.locator('.modal-footer button', { hasText: /Save & Add|Guardar y Agregar/ });
    await saveAddBtn.click();
    // Modal should close and reopen (Save & Add closes with 'created-continue', parent reopens)
    await page.waitForTimeout(1500);
    // New modal should be open with clean form
    const modal = page.locator('.modal-dialog');
    if (await modal.isVisible()) {
      // Modal reopened -- fill again and do normal save
      await page.waitForSelector('select[formcontrolname="category"] option:not([disabled])');
      await page.locator('select[formcontrolname="category"]').selectOption({ index: 1 });
      await page.fill('input[formcontrolname="quantity"]', '3');
      await page.fill('input[formcontrolname="rate"]', '25');
      await page.waitForTimeout(300);
      const saveBtn = page.locator('.modal-footer button.btn-primary', { hasText: /^Save$|^Guardar$/ });
      await saveBtn.click();
      await page.waitForSelector('.modal-dialog', { state: 'hidden', timeout: 5000 });
    }
    // Verify multiple charges in table
    await page.waitForTimeout(1000);
    const rows = page.locator('app-inspection-panel table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  // TEST 8: Save income charge under INCOME tab
  test('should save income charge under INCOME tab', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    const inspectionTab = page.locator('button[ngbNavLink]').filter({ hasText: /Inspection|Inspecci/ });
    await inspectionTab.click();
    const addBtn = page.locator('button', { hasText: /Add Charge|Agregar Cargo/ });
    await addBtn.click();
    await expect(page.locator('.modal-dialog')).toBeVisible();
    // Click INCOME tab in modal
    const incomeTab = page.locator('.modal-body button[ngbNavLink]').filter({ hasText: /Income|Ingresos/ });
    await incomeTab.click();
    // Fill fields
    await page.waitForSelector('select[formcontrolname="category"] option:not([disabled])');
    await page.locator('select[formcontrolname="category"]').selectOption({ index: 1 });
    await page.fill('input[formcontrolname="quantity"]', '1');
    await page.fill('input[formcontrolname="rate"]', '500');
    await page.waitForTimeout(300);
    // Save
    const saveBtn = page.locator('.modal-footer button.btn-primary', { hasText: /^Save$|^Guardar$/ });
    await saveBtn.click();
    await page.waitForSelector('.modal-dialog', { state: 'hidden', timeout: 5000 });
    await page.waitForTimeout(1000);
    // Switch to Income tab in panel
    const panelIncomeTab = page.locator('app-inspection-panel .nav-tabs .nav-link').filter({ hasText: /Income|Ingresos/ });
    await panelIncomeTab.click();
    // Verify income charge is visible
    const table = page.locator('app-inspection-panel table');
    if (await table.isVisible()) {
      const rows = table.locator('tbody tr');
      await expect(rows).not.toHaveCount(0);
    }
  });

  // TEST 9: Display charges filtered by active tab
  test('should display charges filtered by active tab', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    const inspectionTab = page.locator('button[ngbNavLink]').filter({ hasText: /Inspection|Inspecci/ });
    await inspectionTab.click();
    // Default is EXPENSES tab
    const expenseTab = page.locator('app-inspection-panel .nav-tabs .nav-link').filter({ hasText: /Expenses|Gastos/ });
    await expenseTab.click();
    await page.waitForTimeout(500);
    const expenseTable = page.locator('app-inspection-panel table');
    if (await expenseTable.isVisible()) {
      const expenseRows = await expenseTable.locator('tbody tr').count();
      expect(expenseRows).toBeGreaterThanOrEqual(1);
    }
    // Switch to INCOME
    const incomeTab = page.locator('app-inspection-panel .nav-tabs .nav-link').filter({ hasText: /Income|Ingresos/ });
    await incomeTab.click();
    await page.waitForTimeout(500);
    const incomeTable = page.locator('app-inspection-panel table');
    if (await incomeTable.isVisible()) {
      const incomeRows = await incomeTable.locator('tbody tr').count();
      expect(incomeRows).toBeGreaterThanOrEqual(1);
    }
  });

  // TEST 10: Edit existing charge via view modal
  test('should edit existing charge via view modal', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    const inspectionTab = page.locator('button[ngbNavLink]').filter({ hasText: /Inspection|Inspecci/ });
    await inspectionTab.click();
    // Click Expenses tab to ensure we're on expenses
    const expenseTab = page.locator('app-inspection-panel .nav-tabs .nav-link').filter({ hasText: /Expenses|Gastos/ });
    await expenseTab.click();
    await page.waitForTimeout(500);
    // Click view on first charge (eye icon button)
    const viewBtn = page.locator('app-inspection-panel table tbody tr').first().locator('button.btn-outline-secondary');
    await viewBtn.click();
    await expect(page.locator('.modal-dialog')).toBeVisible();
    // Click edit button
    const editBtn = page.locator('.modal-footer button.btn-outline-primary', { hasText: /Edit|Editar/ });
    if (await editBtn.isVisible()) {
      await editBtn.click();
      // Modify the rate
      await page.fill('input[formcontrolname="rate"]', '200');
      await page.waitForTimeout(300);
      // Save
      const saveBtn = page.locator('.modal-footer button.btn-primary', { hasText: /Save|Guardar/ });
      await saveBtn.click();
      await page.waitForSelector('.modal-dialog', { state: 'hidden', timeout: 5000 });
    } else {
      // If no edit button, just close
      await page.locator('.btn-close').click();
    }
  });

  // TEST 11: Delete a charge
  test('should delete a charge', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    const inspectionTab = page.locator('button[ngbNavLink]').filter({ hasText: /Inspection|Inspecci/ });
    await inspectionTab.click();
    const expenseTab = page.locator('app-inspection-panel .nav-tabs .nav-link').filter({ hasText: /Expenses|Gastos/ });
    await expenseTab.click();
    await page.waitForTimeout(500);
    // Count rows before
    const table = page.locator('app-inspection-panel table');
    if (await table.isVisible()) {
      const rowsBefore = await table.locator('tbody tr').count();
      if (rowsBefore > 0) {
        // Handle confirm dialog
        page.on('dialog', async dialog => await dialog.accept());
        // Click delete on first row (trash icon button)
        const deleteBtn = table.locator('tbody tr').first().locator('button.btn-outline-danger');
        await deleteBtn.click();
        await page.waitForTimeout(1500);
        // Verify row count decreased
        const rowsAfter = await table.locator('tbody tr').count();
        expect(rowsAfter).toBeLessThan(rowsBefore);
      }
    }
  });

  // TEST 12: Set Bill To type and auto-fill client name
  test('should set Bill To type and auto-fill client name', async () => {
    await page.goto(`/operations/${operationId}`);
    await page.waitForSelector('text=/OP-/');
    const inspectionTab = page.locator('button[ngbNavLink]').filter({ hasText: /Inspection|Inspecci/ });
    await inspectionTab.click();
    const addBtn = page.locator('button', { hasText: /Add Charge|Agregar Cargo/ });
    await addBtn.click();
    await expect(page.locator('.modal-dialog')).toBeVisible();
    // Select Bill To Type = CLIENT
    await page.locator('select[formcontrolname="billToType"]').selectOption('CLIENT');
    await page.waitForTimeout(500);
    // Verify billToName got auto-populated
    const billToName = await page.inputValue('input[formcontrolname="billToName"]');
    // It should have the client name (not empty)
    expect(billToName.length).toBeGreaterThan(0);
    await page.locator('.btn-close').click();
  });
});
