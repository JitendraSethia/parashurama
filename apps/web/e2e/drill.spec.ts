import { expect, test } from '@playwright/test';

test.describe('PARASHURAMA end to end', () => {
  test('first visit shows the tour, and End tour skips it', async ({ page }) => {
    await page.goto('/?reset&nohome');
    await expect(page.locator('#tour')).toHaveClass(/on/);
    await expect(page.locator('#tourT')).toHaveText('Welcome to PARASHURAMA');
    await page.click('#tourEnd');
    await expect(page.locator('#tour')).not.toHaveClass(/on/);
    await expect(page.locator('#beginBtn')).toBeVisible();
  });

  test('the tour pauses the drill and resumes it afterwards', async ({ page }) => {
    await page.goto('/?reset&nohome');
    for (let i = 0; i < 6; i++) await page.click('#tourNext'); // brief steps → Begin (starts Academy lesson 1)
    await expect(page.locator('#fight')).toHaveClass(/on/);
    const t0 = await page.evaluate(() => (window as any).PARA.L.tick);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => (window as any).PARA.L.tick)).toBe(t0);
    for (let i = 0; i < 5; i++) await page.click('#tourNext'); // fight steps
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => (window as any).PARA.L.tick)).toBeGreaterThan(t0);
  });

  test('a full drill produces a verified debrief and an adapted next drill', async ({ page }) => {
    await page.goto('/?reset&nohome');
    await page.click('#tourEnd');
    const drill = await page.locator('#drillNo').textContent();
    await page.click('#beginBtn');
    await page.evaluate(() => (window as any).PARA.autoplay());
    await expect(page.locator('#learn')).toHaveClass(/on/);
    await expect(page.locator('.scoreBig b')).toHaveText(/^\d{1,3}$/);
    await expect(page.locator('#integrity')).toContainText('verified, same score on re-run');
    await expect(page.locator('#hashOut')).toContainText('SHA-256 chain:', { timeout: 5000 });
    await expect(page.locator('#audit tr')).not.toHaveCount(1);
    await page.click('#nextBtn');
    await expect(page.locator('#brief')).toHaveClass(/on/);
    await expect(page.locator('#drillNo')).not.toHaveText(drill ?? '');
  });

  test('clicking a radar blip tracks it and shows clues', async ({ page }) => {
    await page.goto('/?reset&nohome');
    await page.click('#tourEnd');
    await page.click('#beginBtn');
    const pt = await page.evaluate(() => {
      const P = (window as any).PARA, L = P.L;
      const c = L.contacts.find((x: any) => x.state === 'live' && L.tick - x.lastPaint < 40);
      if (!c) return null;
      const r = (document.querySelector('#radar') as HTMLCanvasElement).getBoundingClientRect();
      return { x: r.left + ((500 + (c.x * 470) / 3000) / 1000) * r.width, y: r.top + ((500 + (c.y * 470) / 3000) / 1000) * r.height };
    });
    test.skip(!pt, 'no blip visible at drill start for this seed');
    await page.mouse.click(pt!.x, pt!.y);
    await expect(page.locator('#selTitle')).toContainText('T01');
    await expect(page.locator('#clues .clue').first()).toContainText('Radar');
  });

  test('field guide: open on the brief, blocked during scored drills', async ({ page }) => {
    await page.goto('/?reset&nohome');
    await page.click('#tourEnd');
    await page.keyboard.press('f');
    await expect(page.locator('#fieldGuide')).toHaveClass(/on/);
    await expect(page.locator('#fieldGuide')).toContainText('Loitering munition');
    await page.keyboard.press('Escape');
    await page.click('#beginBtn');
    await page.keyboard.press('f');
    await expect(page.locator('#fieldGuide')).not.toHaveClass(/on/);
  });

  test('Academy lesson 1: a beginner who follows the coach completes it', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/?reset&nohome');
    await page.click('#tourEnd');
    await page.click('.lessonBtn[data-lesson="1"]');
    await page.evaluate(() => ((window as any).__TIMEWARP = 6));
    await expect(page.locator('#coachCol')).toBeVisible();
    for (let i = 0; i < 300 && (await page.locator('#fight').getAttribute('class'))?.includes('on'); i++) {
      const card = (await page.locator('.coachCard').innerText().catch(() => '')) || '';
      if (/New contact/.test(card)) {
        const pt = await page.evaluate(() => {
          const L = (window as any).PARA.L;
          const c = L.contacts.filter((x: any) => x.state === 'live' && x.trackTick == null && L.tick - x.lastPaint < 48)[0];
          if (!c) return null;
          const r = (document.querySelector('#radar') as HTMLCanvasElement).getBoundingClientRect();
          return { x: r.left + ((500 + (c.x * 470) / 3000) / 1000) * r.width, y: r.top + ((500 + (c.y * 470) / 3000) / 1000) * r.height };
        });
        if (pt) { await page.mouse.click(pt.x, pt.y); continue; }
      }
      if (/needs a decision/.test(card)) { await page.keyboard.press('Tab'); continue; }
      const keys = await page.locator('.coachCard .doThis kbd').allInnerTexts();
      for (const k of keys) await page.keyboard.press(k === 'Enter' ? 'Enter' : k.toLowerCase());
      await page.waitForTimeout(keys.length ? 150 : 100);
    }
    await expect(page.locator('#learn')).toHaveClass(/on/);
    await expect(page.locator('#scoreCard .verdict')).toContainText('Lesson complete');
    await expect(page.locator('#nextBtn')).toContainText('Start lesson 2');
  });
});
