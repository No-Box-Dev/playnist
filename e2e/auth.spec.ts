import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('landing page shows logo, tagline, and both buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.auth-welcome-logo img')).toBeVisible();
    await expect(page.locator('.auth-tagline')).toContainText('your game library');
    await expect(page.locator('button:has-text("SIGN UP")')).toBeVisible();
    await expect(page.locator('button:has-text("SIGN IN")')).toBeVisible();
  });

  test('SIGN IN button shows signin form', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("SIGN IN")').click();
    await expect(page.locator('text=Welcome back')).toBeVisible();
    await expect(page.locator('input[placeholder="Type Email"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Type Password"]')).toBeVisible();
  });

  test('SIGN UP button shows multi-step signup form', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("SIGN UP")').click();
    await expect(page.locator('text=Create an account')).toBeVisible();
    await expect(page.locator('.signup-tab:has-text("Email")')).toBeVisible();
    await expect(page.locator('.signup-tab:has-text("Password")')).toBeVisible();
    await expect(page.locator('.signup-tab:has-text("Username")')).toBeVisible();
  });

  test('signup tab navigation works', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("SIGN UP")').click();

    // Email tab active by default
    await expect(page.locator('.signup-tab.active')).toContainText('Email');
    await expect(page.locator('input[placeholder="Your Email"]')).toBeVisible();

    // Fill email and go to Password tab
    await page.locator('input[placeholder="Your Email"]').fill('test@test.com');
    await page.locator('.signup-tab:has-text("Password")').click();
    await expect(page.locator('input[type="password"]:visible').first()).toBeVisible();

    // Fill password and go to Username tab
    await page.locator('input[type="password"]:visible').first().fill('TestPass1!');
    await page.locator('.signup-tab:has-text("Username")').click();
    await expect(page.locator('input[placeholder="Your Username"]')).toBeVisible();
    await expect(page.locator('text=Profile bio')).toBeVisible();
    await expect(page.locator('text=Terms of Service')).toBeVisible();
  });

  test('full signup flow creates account and enters app', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("SIGN UP")').click();
    const ts = Date.now();

    // Email
    await page.locator('input[placeholder="Your Email"]').fill(`e2e${ts}@test.com`);
    await page.locator('.signup-tab:has-text("Password")').click();
    await page.locator('input[type="password"]:visible').first().waitFor({ state: 'visible' });

    // Password
    await page.locator('input[type="password"]:visible').first().fill('TestPass1!');
    await page.locator('.signup-tab:has-text("Username")').click();
    await page.locator('input[placeholder="Your Username"]').waitFor({ state: 'visible' });

    // Username + terms
    await page.locator('input[placeholder="Your Username"]').fill(`E2E${ts}`);
    await page.locator('input[type="checkbox"]').last().check();
    await page.locator('button:has-text("SIGN UP"):visible').click();

    // Should be on onboarding
    await expect(page).toHaveURL(/onboarding/, { timeout: 15000 });
  });

  test('signin form shows error on empty fields', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("SIGN IN")').click();
    await page.locator('.auth-submit').click();
    await expect(page.locator('.field-error')).toBeVisible();
  });

  test('forgot password link works', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("SIGN IN")').click();
    await page.locator('text=Forgot a password').click();
    await expect(page.locator('text=Reset Password')).toBeVisible();
  });

  test('game cover grid displays on auth pages', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.cover-grid-side')).toBeVisible();
    const cards = await page.locator('.cover-grid-card').count();
    expect(cards).toBeGreaterThan(0);
  });
});
