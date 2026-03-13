import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Operation with Port', () => {
  test('should create operation with arrival port', async ({ page }) => {
    await login(page);

    // Navigate to new operation form
    await page.goto('/operations/new');
    await page.waitForSelector('form');

    // Fill required operation fields
    // Client typeahead — type and select first result
    const clientInput = page.locator('input[ngbtypeahead]');
    await clientInput.fill('Demo');
    await page.waitForSelector('ngb-typeahead-window');
    await page.locator('ngb-typeahead-window button').first().click();

    // Operation type
    await page.selectOption('select[formcontrolname="operationType"]', 'IMPORT');

    // BL Number
    await page.fill('input[formcontrolname="blNumber"]', 'BL-PORT-TEST-001');

    // Estimated arrival
    await page.fill('input[formcontrolname="estimatedArrival"]', '2026-06-15T10:00');

    // BL Availability
    await page.selectOption('select[formcontrolname="blAvailability"]', 'ORIGINAL');

    // Select arrival port from dropdown
    await page.selectOption('select[formcontrolname="arrivalPortId"]', { label: /SPS/ });

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForURL('**/operations/**', { timeout: 5000 });

    // Verify port is shown in the operation detail
    await expect(page.locator('text=SPS')).toBeVisible();
    await expect(page.locator('text=Puerto Cortés')).toBeVisible();
  });
});
