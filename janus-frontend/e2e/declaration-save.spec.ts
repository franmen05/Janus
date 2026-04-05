import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test('edit declaration with manual insurance and verify persistence', async ({ page }) => {
  await login(page);

  // 1. Navigate to edit existing declaration (operation 1, declaration 2)
  await page.goto('/operations/1/declarations/2/edit');
  await page.waitForSelector('form');

  // 2. Verify current values loaded
  await page.waitForFunction(() => {
    const input = document.querySelector('input[formcontrolname="fobValue"]') as HTMLInputElement;
    return input && parseFloat(input.value) > 0;
  });

  let fobVal = await page.inputValue('input[formcontrolname="fobValue"]');
  let insVal = await page.inputValue('input[formcontrolname="insuranceValue"]');
  console.log(`Loaded: fob=${fobVal}, insurance=${insVal}`);

  // 3. Change insurance to a manual value of 55
  await page.fill('input[formcontrolname="insuranceValue"]', '55');
  insVal = await page.inputValue('input[formcontrolname="insuranceValue"]');
  const cifVal = await page.inputValue('input[formcontrolname="cifValue"]');
  console.log(`After manual change: insurance=${insVal}, CIF=${cifVal}`);

  // 4. Save
  await page.click('button.btn-primary');
  await page.waitForURL('**/declarations/2', { timeout: 5000 });
  console.log('Saved! Navigated to detail:', page.url());

  // 5. Go back to edit to verify persistence
  await page.goto('/operations/1/declarations/2/edit');
  await page.waitForSelector('form');
  await page.waitForFunction(() => {
    const input = document.querySelector('input[formcontrolname="fobValue"]') as HTMLInputElement;
    return input && parseFloat(input.value) > 0;
  });

  const savedIns = await page.inputValue('input[formcontrolname="insuranceValue"]');
  const savedFob = await page.inputValue('input[formcontrolname="fobValue"]');
  const savedPct = await page.inputValue('input[formcontrolname="insurancePercentage"]');
  console.log(`After reload: fob=${savedFob}, insurance=${savedIns}, pct=${savedPct}`);

  await page.screenshot({ path: '/tmp/decl-after-save.png', fullPage: true });

  expect(parseFloat(savedIns)).toBe(55);
  expect(parseFloat(savedFob)).toBe(1000);
});
