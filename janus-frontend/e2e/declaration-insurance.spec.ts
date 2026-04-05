import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Declaration form - insurance fields', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Navigate to operation 1, create preliminary declaration
    await page.goto('/operations/1/declarations/new?type=PRELIMINARY');
    await page.waitForSelector('form');
  });

  test('auto-calculates insurance from FOB and percentage', async ({ page }) => {
    await page.fill('input[formcontrolname="fobValue"]', '1000');
    const insuranceVal = await page.inputValue('input[formcontrolname="insuranceValue"]');
    console.log('Insurance after FOB=1000, %=2:', insuranceVal);
    expect(parseFloat(insuranceVal)).toBe(20);
  });

  test('recalculates insurance when percentage changes', async ({ page }) => {
    await page.fill('input[formcontrolname="fobValue"]', '1000');
    await page.fill('input[formcontrolname="insurancePercentage"]', '5');
    const insuranceVal = await page.inputValue('input[formcontrolname="insuranceValue"]');
    console.log('Insurance after FOB=1000, %=5:', insuranceVal);
    expect(parseFloat(insuranceVal)).toBe(50);
  });

  test('manual insurance is NOT overwritten when FOB changes', async ({ page }) => {
    await page.fill('input[formcontrolname="fobValue"]', '1000');
    // Manually set insurance to 99
    await page.fill('input[formcontrolname="insuranceValue"]', '99');
    // Now change FOB
    await page.fill('input[formcontrolname="fobValue"]', '2000');
    const insuranceVal = await page.inputValue('input[formcontrolname="insuranceValue"]');
    console.log('Insurance after manual=99 then FOB=2000:', insuranceVal);
    expect(parseFloat(insuranceVal)).toBe(99);
  });

  test('percentage change resets manual flag and recalculates', async ({ page }) => {
    await page.fill('input[formcontrolname="fobValue"]', '1000');
    await page.fill('input[formcontrolname="insuranceValue"]', '99');
    await page.fill('input[formcontrolname="insurancePercentage"]', '3');
    const insuranceVal = await page.inputValue('input[formcontrolname="insuranceValue"]');
    console.log('Insurance after manual=99 then %=3:', insuranceVal);
    expect(parseFloat(insuranceVal)).toBe(30);
  });

  test('CIF includes manual insurance value', async ({ page }) => {
    await page.fill('input[formcontrolname="fobValue"]', '1000');
    await page.fill('input[formcontrolname="freightValue"]', '100');
    await page.fill('input[formcontrolname="insuranceValue"]', '50');
    const cifVal = await page.inputValue('input[formcontrolname="cifValue"]');
    console.log('CIF after FOB=1000, freight=100, insurance=50:', cifVal);
    expect(parseFloat(cifVal)).toBe(1150);
  });

  test('visual check - screenshot of form with values', async ({ page }) => {
    await page.fill('input[formcontrolname="fobValue"]', '1000');
    await page.fill('input[formcontrolname="freightValue"]', '100');
    // Check auto-calculated values
    let insVal = await page.inputValue('input[formcontrolname="insuranceValue"]');
    let cifVal = await page.inputValue('input[formcontrolname="cifValue"]');
    console.log('After FOB=1000, freight=100: insurance=' + insVal + ', CIF=' + cifVal);

    // Manually override insurance
    await page.fill('input[formcontrolname="insuranceValue"]', '77');
    cifVal = await page.inputValue('input[formcontrolname="cifValue"]');
    console.log('After manual insurance=77: CIF=' + cifVal);

    // Change FOB - insurance should stay at 77
    await page.fill('input[formcontrolname="fobValue"]', '2000');
    insVal = await page.inputValue('input[formcontrolname="insuranceValue"]');
    cifVal = await page.inputValue('input[formcontrolname="cifValue"]');
    const pctVal = await page.inputValue('input[formcontrolname="insurancePercentage"]');
    console.log('After FOB=2000: insurance=' + insVal + ', CIF=' + cifVal + ', pct=' + pctVal);

    await page.screenshot({ path: '/tmp/declaration-form.png', fullPage: true });
  });
});
