import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Port CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display seeded ports list', async ({ page }) => {
    await page.goto('/ports');
    await page.waitForSelector('table');
    // Verify seeded ports are shown
    const rows = page.locator('table tbody tr');
    await expect(rows).not.toHaveCount(0);
    // Check for a known seeded port
    await expect(page.locator('text=SPS')).toBeVisible();
    await expect(page.locator('text=Puerto Cortés')).toBeVisible();
  });

  test('should create a new port', async ({ page }) => {
    await page.goto('/ports/new');
    await page.waitForSelector('form');
    await page.fill('input[formcontrolname="code"]', 'TST');
    await page.fill('input[formcontrolname="name"]', 'Test Port');
    await page.fill('textarea[formcontrolname="description"]', 'E2E test port');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/ports', { timeout: 5000 });
    // Verify the new port appears in the list
    await expect(page.locator('text=TST')).toBeVisible();
    await expect(page.locator('text=Test Port')).toBeVisible();
  });

  test('should edit an existing port', async ({ page }) => {
    // First create a port via API
    await page.request.post('http://localhost:8080/api/ports', {
      data: { code: 'EDT', name: 'Edit Me Port', description: 'To be edited' },
      headers: { 'Authorization': 'Basic ' + btoa('admin:admin123'), 'Content-Type': 'application/json' }
    });

    await page.goto('/ports');
    await page.waitForSelector('table');
    // Find the row with EDT and click Edit
    const row = page.locator('tr', { hasText: 'EDT' });
    await row.locator('a', { hasText: /edit/i }).click();
    await page.waitForSelector('form');
    // Verify form is pre-filled
    await expect(page.locator('input[formcontrolname="name"]')).toHaveValue('Edit Me Port');
    // Change the name
    await page.fill('input[formcontrolname="name"]', 'Edited Port');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/ports', { timeout: 5000 });
    // Verify updated name in list
    await expect(page.locator('text=Edited Port')).toBeVisible();
  });

  test('should search/filter ports', async ({ page }) => {
    await page.goto('/ports');
    await page.waitForSelector('table');
    // Type in search box
    await page.fill('.card-header input[type="text"]', 'Cortés');
    // Should show Puerto Cortés but not others
    await expect(page.locator('text=Puerto Cortés')).toBeVisible();
    // La Ceiba should be filtered out
    await expect(page.locator('table tbody tr')).toHaveCount(1);
  });

  test('AGENT should not see Ports in sidebar', async ({ page }) => {
    // Login as agent
    await page.goto('/login');
    await page.fill('#username', 'agent');
    await page.fill('#password', 'agent123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    // Check that Ports nav item is NOT visible
    await expect(page.locator('nav a[href="/ports"]')).not.toBeVisible();
  });
});
