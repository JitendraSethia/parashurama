import { expect, test } from '@playwright/test';

test.describe('Showcase demo and phones', () => {
  test('the 90-second demo plays end to end and never saves a drill', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/?reset');
    await expect(page.locator('#home')).toHaveClass(/on/);
    const before = await page.evaluate(() => (window as any).PARA.DB.H.length);
    await page.click('#hcDemo');
    await expect(page.locator('#showcase .scStep')).toContainText('The mission');
    await expect(page.locator('#showcase .scStep')).toContainText('Detect', { timeout: 30_000 });
    await expect(page.locator('#learn')).toHaveClass(/on/, { timeout: 120_000 });
    await expect(page.locator('#showcase h3')).toHaveText("That's PARASHURAMA.", { timeout: 60_000 });
    expect(await page.evaluate(() => (window as any).PARA.DB.H.length)).toBe(before);
    await page.click('#scTry');
    await expect(page.locator('#home')).toHaveClass(/on/);
  });

  test('Esc leaves the demo cleanly, back to the hub', async ({ page }) => {
    await page.goto('/?reset');
    await page.click('#hcDemo');
    await expect(page.locator('#fight')).toHaveClass(/on/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#showcase')).not.toHaveClass(/on/);
    await expect(page.locator('#home')).toHaveClass(/on/);
  });

  test('phones: no sideways scrolling on the hub, brief, drill or debrief', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const width = () => page.evaluate(() => document.documentElement.scrollWidth);
    await page.goto('/?reset');
    expect(await width()).toBeLessThanOrEqual(390);
    await page.tap('#hcDrill'); await page.tap('#tourEnd');
    expect(await width()).toBeLessThanOrEqual(390);
    await page.tap('#beginBtn');
    await expect(page.locator('#fight')).toHaveClass(/on/);
    expect(await width()).toBeLessThanOrEqual(390);
    await page.evaluate(() => (window as any).PARA.autoplay());
    await expect(page.locator('#learn')).toHaveClass(/on/);
    expect(await width()).toBeLessThanOrEqual(390);
    await ctx.close();
  });
});
