import { test, expect } from '@playwright/test';

test.describe('Gameplay Suite - Core Cipher Guessing and State Persistence', () => {
  const url = 'http://localhost:5173/games/daily-word-cipher/';

  test.beforeEach(async ({ page }) => {

    await page.route('**/api/hint/today', route => route.fulfill({ status: 200, body: '{"hint": "test hint"}' }));
    await page.route('**/api/telemetry', route => route.fulfill({ status: 200, body: '{"success":true}' }));
    // intercept anything else that might block

    // Clear local storage and reset to ensure a fresh environment
    await page.addInitScript(() => {
      window.localStorage.clear();
    });

    await page.goto(url);

    // Bypass Instructions modal if present
    const initializeBtn = page.locator('button', { hasText: 'INITIALIZE GAME' });
    if (await initializeBtn.isVisible()) {
        await initializeBtn.click({ force: true });
        await page.waitForTimeout(2000);
    }
    const continueBtn = page.locator('button', { hasText: 'CONTINUE' });
    if (await continueBtn.isVisible()) {
        await continueBtn.click({ force: true });
        await page.waitForTimeout(1500);
    }
  });

  test('Validates entering a 5-letter word via virtual and physical keyboards', async ({ page }) => {
    // Physical Keyboard: Press keys 'H', 'E', 'L', 'L', 'O', 'Enter'
    await page.keyboard.type('HELLO');

    // Check if the board has the current guess registered (before submit)
    // Board target active row has not submitted yet
    const activeTiles = page.locator('.grid > div.flex.gap-2:not(:has(.bg-tile-absent)):not(:has(.bg-tile-present)):not(:has(.bg-tile-correct)) > div');

    // Virtual Keyboard: Delete via virtual key
    await page.locator('button[aria-label="Backspace"]').click({ force: true }); // Delete 'O'
    await page.locator('button[aria-label="Backspace"]').click({ force: true }); // Delete 'L'

    // Virtual Keyboard: Press keys via on-screen keyboard
    await page.locator('button', { hasText: 'A' }).nth(0).click({ force: true }); // We use nth(0) in case 'A' appears in other UI elements, but usually keyboard button is specific enough
    await page.locator('button', { hasText: 'R' }).nth(0).click({ force: true });
    await page.locator('button', { hasText: 'T' }).nth(0).click({ force: true });

    // The word is now H E L A R T -> wait, H E L deleted O L -> H E L -> H E L A R
    // Let's just submit HELAR
    await page.locator('button:has-text("ENTER")').click({ force: true });

    // Verify evaluation - at least one guess row is completed
    await page.waitForTimeout(2000);
    const evaluatedRow = page.locator('.grid > div.flex.gap-2').first();
    await page.waitForTimeout(2000);
    const classes = await evaluatedRow.locator('div').first().getAttribute('class');
    expect(classes).toMatch(/bg-tile-/); // Should have an evaluated class
  });

  test('Validates tile colors and keyboard key styling update on valid guess', async ({ page }) => {
    // We mock the word to be predictable or simply guess 'REACT' and verify colors apply
    await page.keyboard.type('REACT');
    await page.keyboard.press('Enter');

    // Verify evaluating a word results in colors:
    // border-neon-green (correct), border-yellow-400 (present), or border-gray-700 (absent)
    await page.waitForTimeout(2000);
    const evaluatedRow = page.locator('.grid > div.flex.gap-2').first();
    const firstTile = evaluatedRow.locator('div').nth(0);
    const classes = await firstTile.getAttribute('class');
    const hasEvaluatedBorder = classes.includes('border-neon-green') || classes.includes('border-yellow-400') || classes.includes('border-gray-700');
    expect(hasEvaluatedBorder).toBeTruthy();

    // Verify keyboard keys update styling
    // If 'R' was guessed, the 'R' key should have an evaluated background color
    const rKey = page.locator('button', { hasText: /^R$/ }).nth(0);
    const rKeyClasses = await rKey.getAttribute('class');
    const rKeyEvaluated = rKeyClasses.includes('bg-tile-correct') || rKeyClasses.includes('bg-tile-present') || rKeyClasses.includes('bg-tile-absent');
    expect(rKeyEvaluated).toBeTruthy();
  });

  test('Asserts board evaluations trigger aria-live polite screen-reader announcement', async ({ page }) => {
    await page.keyboard.type('GAMES');
    await page.keyboard.press('Enter');

    // Wait for guess to be processed
    await page.waitForTimeout(1500);

    // Assert aria-live container announces the guess
    const ariaLiveRegion = page.locator('div[aria-live="polite"]');
    const text = await ariaLiveRegion.textContent();
    expect(text).toMatch(/Guess \d+ submitted/);
  });

  test('Validates that reloading the page hydrates active puzzle board state from localStorage', async ({ page }) => {
    // Type a word and submit
    await page.keyboard.type('STATE');
    await page.keyboard.press('Enter');

    // Wait for the guess to register and save to localStorage
    await page.waitForTimeout(3000); // give it time to evaluate and save

    // Reload the page
    await page.reload();

    // Bypass Instructions modal if present after reload
    const initializeBtn = page.locator('button', { hasText: 'INITIALIZE GAME' });
    if (await initializeBtn.isVisible()) {
        await initializeBtn.click({ force: true });
        await page.waitForTimeout(1500);
    }
    const continueBtn = page.locator('button', { hasText: 'CONTINUE' });
    if (await continueBtn.isVisible()) {
        await continueBtn.click({ force: true });
        await page.waitForTimeout(1500);
    }

    // Verify the evaluated row is still present
    const evaluatedRows = page.locator('.grid > div.flex.gap-2:has(div.bg-tile-correct, div.bg-tile-present, div.bg-tile-absent)');
    const count = await evaluatedRows.count();
    expect(count).toBeGreaterThanOrEqual(1); // At least the one we just guessed
  });
});
