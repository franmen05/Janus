import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

async function goToDeclarationsTab(page: import('@playwright/test').Page) {
  await page.goto('/operations/1');
  const declTab = page.locator('button[ngbNavLink]').filter({ hasText: /Declarations|Declaraciones/ });
  await declTab.waitFor({ timeout: 5000 });
  await declTab.click();
  await page.waitForSelector('app-declaration-list', { timeout: 5000 });
}

test.describe('Declaration DUA unification', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('declaration table has correct columns (no separate DUA column)', async ({ page }) => {
    await goToDeclarationsTab(page);

    const table = page.locator('app-declaration-list table');
    await table.waitFor({ timeout: 5000 });

    const headers = table.locator('thead th');
    const headerTexts = await headers.allTextContents();
    console.log('Table headers:', headerTexts);

    // Verify expected columns exist
    expect(headerTexts.some(h => /Type|Tipo/i.test(h))).toBeTruthy();
    expect(headerTexts.some(h => /Declaration Number|Número de Declaración/i.test(h))).toBeTruthy();
    expect(headerTexts.some(h => /FOB/i.test(h))).toBeTruthy();
    expect(headerTexts.some(h => /CIF/i.test(h))).toBeTruthy();

    // Verify NO separate "DUA Number" column exists
    const hasDuaColumn = headerTexts.some(h => /^DUA|DUA Number|Número de DUA/i.test(h));
    expect(hasDuaColumn).toBeFalsy();
    console.log('No DUA column found - correct');
  });

  test('"Registrar DUA" button visible when no declarationNumber', async ({ page }) => {
    await goToDeclarationsTab(page);

    const table = page.locator('app-declaration-list table');
    await table.waitFor({ timeout: 5000 });

    // Operation 1 has a declaration with empty declarationNumber
    const registerDuaBtn = page.locator('button').filter({ hasText: /Register DUA|Registrar DUA/i });
    await expect(registerDuaBtn.first()).toBeVisible();
    console.log('Registrar DUA button visible for declaration without declarationNumber');
  });

  test('"Registrar DUA" assigns declarationNumber and button disappears', async ({ page }) => {
    await goToDeclarationsTab(page);

    const table = page.locator('app-declaration-list table');
    await table.waitFor({ timeout: 5000 });

    const registerDuaBtn = page.locator('button').filter({ hasText: /Register DUA|Registrar DUA/i });
    await expect(registerDuaBtn.first()).toBeVisible();

    // Handle the prompt dialog before clicking
    const duaNumber = 'DUA-2024-001';
    page.on('dialog', async (dialog) => {
      console.log('Dialog:', dialog.type(), dialog.message());
      await dialog.accept(duaNumber);
    });

    await registerDuaBtn.first().click();

    // Wait for table to reload with updated data
    await page.waitForTimeout(1500);

    // Verify DUA number now appears in the table
    const cellWithDua = page.locator('app-declaration-list table tbody td').filter({ hasText: duaNumber });
    await expect(cellWithDua.first()).toBeVisible({ timeout: 5000 });
    console.log('DUA number appears in the table:', duaNumber);

    // Verify the button disappeared for that row
    const rowWithDua = page.locator('app-declaration-list table tbody tr').filter({ hasText: duaNumber });
    const duaBtnInRow = rowWithDua.locator('button').filter({ hasText: /Register DUA|Registrar DUA/i });
    await expect(duaBtnInRow).toHaveCount(0);
    console.log('Registrar DUA button disappeared after registration');
  });

  test('declaration detail has no separate duaNumber field', async ({ page }) => {
    // Navigate directly to declaration detail
    await page.goto('/operations/1/declarations/2');
    await page.waitForSelector('app-declaration-detail', { timeout: 5000 });

    // Verify the title shows the declarationNumber
    const title = page.locator('h3');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    console.log('Declaration detail title:', titleText);
    expect(titleText).toContain('DUA-2024-001');

    // Verify no separate DUA label in the detail card
    const detailCard = page.locator('app-declaration-detail .card');
    await detailCard.waitFor({ timeout: 5000 });
    const duaLabel = detailCard.locator('dt').filter({ hasText: /DUA Number|Número de DUA/i });
    await expect(duaLabel).toHaveCount(0);
    console.log('No separate DUA number field in declaration detail');
  });
});
