import { test, expect } from '@playwright/test';

test.describe('Header & Navigation Suite', () => {
  const url = 'http://localhost:5173/';

  test.beforeEach(async ({ page }) => {
    await page.goto(url);
    const continueBtn = page.locator('button', { hasText: 'CONTINUE' });
    if (await continueBtn.isVisible()) {
        await continueBtn.click({ force: true });
        await page.waitForTimeout(500);
    }
  });

  test('Desktop (1280x800): validates header branding and outbound navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Check logo rendering
    const logoImage = page.locator('header img[alt="AXiM Development"]');
    await expect(logoImage).toBeVisible();
    await expect(logoImage).toHaveAttribute('src', 'https://wp.axim.us.com/wp-content/uploads/2026/08/AXiM-Development-1200x628-layout1284-infrastructure-axim-axim-axim-1l7q5v7.webp');

    // Check anchor tag attributes
    const logoAnchor = page.locator('header a').filter({ has: page.locator('img[alt="AXiM Development"]') });
    await expect(logoAnchor).toHaveAttribute('target', '_blank');
    await expect(logoAnchor).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(logoAnchor).toHaveAttribute('href', 'https://axim.us.com/games');

    // Set up request interception specifically for the telemetry
    let telemetryFired = false;
    await page.route('**/api/telemetry', async route => {
      const request = route.request();
      if (request.method() === 'POST') {
        const data = request.postDataJSON();
        if (data && data.event_name === 'NAVIGATED_TO_AXIM_GAMES') {
          telemetryFired = true;
        }
      }
      await route.fulfill({ status: 200, body: '{"success":true}' });
    });

    // Instead of clicking and risking navigation preventing our script,
    // let's evaluate a click on the DOM node but prevent default event behavior
    // that triggers navigation, while still triggering React's onClick handler.
    await logoAnchor.evaluate(node => {
        const handler = (e) => { e.preventDefault(); };
        node.addEventListener('click', handler);
        node.click();
        node.removeEventListener('click', handler);
    });

    // wait a bit for the async fetch to trigger
    await page.waitForTimeout(1000);
    expect(telemetryFired).toBe(true);

    // Ensure no visual overlap
    const headerLeft = await page.locator('header > div > div.flex.items-center').first().boundingBox();
    const headerRight = await page.locator('header > div > div.flex.items-center.shrink-0').first().boundingBox();

    if (headerLeft && headerRight) {
       expect(headerLeft.x + headerLeft.width).toBeLessThanOrEqual(headerRight.x);
    }
  });

  test('Mobile (375x667): validates responsive layout and no clipped CTA', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const logoImage = page.locator('header img[alt="AXiM Development"]');
    await expect(logoImage).toBeVisible();

    const headerBounds = await page.locator('header').boundingBox();
    const rightContainer = await page.locator('header > div > div.flex.items-center.shrink-0').first().boundingBox();

    if (headerBounds && rightContainer) {
        expect(rightContainer.x + rightContainer.width).toBeLessThanOrEqual(headerBounds.x + headerBounds.width + 1);
    }
  });
});
