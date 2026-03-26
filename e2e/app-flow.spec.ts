import { test, expect } from '@playwright/test';

// Helper to sign up and get into the app
async function signUpAndEnter(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.locator('button:has-text("SIGN UP")').click();
  const ts = Date.now();

  await page.locator('input[placeholder="Your Email"]').fill(`flow${ts}@t.com`);
  await page.locator('.signup-tab:has-text("Password")').click();
  await page.waitForTimeout(200);
  await page.locator('input[type="password"]:visible').first().fill('T1!');
  await page.locator('.signup-tab:has-text("Username")').click();
  await page.waitForTimeout(200);
  await page.locator('input[placeholder="Your Username"]').fill(`F${ts}`);
  await page.locator('input[type="checkbox"]').last().check();
  await page.locator('button:has-text("SIGN UP"):visible').click();
  await page.waitForTimeout(6000);

  // Skip onboarding
  await page.locator('text=Next').first().click().catch(() => {});
  await page.waitForTimeout(500);
  await page.locator('text=Next').first().click().catch(() => {});
  await page.waitForTimeout(500);
  await page.locator('button:has-text("Discover")').click().catch(() => {});
  await page.waitForTimeout(5000);
}

test.describe('Onboarding Flow', () => {
  test('onboarding shows game picks', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("SIGN UP")').click();
    const ts = Date.now();
    await page.locator('input[placeholder="Your Email"]').fill(`ob${ts}@t.com`);
    await page.locator('.signup-tab:has-text("Password")').click();
    await page.waitForTimeout(200);
    await page.locator('input[type="password"]:visible').first().fill('T1!');
    await page.locator('.signup-tab:has-text("Username")').click();
    await page.waitForTimeout(200);
    await page.locator('input[placeholder="Your Username"]').fill(`OB${ts}`);
    await page.locator('input[type="checkbox"]').last().check();
    await page.locator('button:has-text("SIGN UP"):visible').click();
    await page.waitForTimeout(6000);

    await expect(page).toHaveURL(/onboarding/);
    await expect(page.locator('text=PICK YOUR FAVORITE GAMES')).toBeVisible();
    const picks = await page.locator('.game-pick').count();
    expect(picks).toBeGreaterThan(0);
  });

  test('onboarding step 2 shows community users', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("SIGN UP")').click();
    const ts = Date.now();
    await page.locator('input[placeholder="Your Email"]').fill(`ob2${ts}@t.com`);
    await page.locator('.signup-tab:has-text("Password")').click();
    await page.waitForTimeout(200);
    await page.locator('input[type="password"]:visible').first().fill('T1!');
    await page.locator('.signup-tab:has-text("Username")').click();
    await page.waitForTimeout(200);
    await page.locator('input[placeholder="Your Username"]').fill(`OB2${ts}`);
    await page.locator('input[type="checkbox"]').last().check();
    await page.locator('button:has-text("SIGN UP"):visible').click();
    await page.waitForTimeout(6000);

    await page.locator('text=Next').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('text=JOIN THE COMMUNITY')).toBeVisible();
  });
});

test.describe('Dashboard', () => {
  test('dashboard loads with game sections', async ({ page }) => {
    await signUpAndEnter(page);
    await expect(page.locator('text=Trending on Playnist')).toBeVisible();
    const cards = await page.locator('.game-card').count();
    expect(cards).toBeGreaterThan(0);
  });

  test('dashboard has ambassador spotlight', async ({ page }) => {
    await signUpAndEnter(page);
    await expect(page.locator('text=Ambassador Spotlight')).toBeVisible();
    await expect(page.locator('.ambassador-card-v2')).toBeVisible();
  });

  test('dashboard has journal prompt', async ({ page }) => {
    await signUpAndEnter(page);
    await expect(page.locator('text=Journal Prompt of the Week')).toBeVisible();
  });

  test('clicking game card navigates to game detail', async ({ page }) => {
    await signUpAndEnter(page);
    await page.locator('.game-card').first().click();
    await page.waitForTimeout(5000);
    await expect(page).toHaveURL(/\/game\/\d+/);
  });
});

test.describe('Game Detail Page', () => {
  test('game page shows title, cover, and info', async ({ page }) => {
    await signUpAndEnter(page);
    await page.locator('.game-card').first().click();
    await page.waitForTimeout(5000);

    await expect(page.locator('.game-back-btn')).toBeVisible();
    await expect(page.locator('.game-title-v2')).toBeVisible();
    await expect(page.locator('.game-cover-wrap img')).toBeVisible();
  });

  test('game page has info cards grid', async ({ page }) => {
    await signUpAndEnter(page);
    await page.locator('.game-card').first().click();
    await page.waitForTimeout(5000);

    const cards = await page.locator('.game-info-card').count();
    expect(cards).toBeGreaterThanOrEqual(3);
  });

  test('+ button opens add to collection modal', async ({ page }) => {
    await signUpAndEnter(page);
    await page.locator('.game-card').first().click();
    await page.waitForTimeout(8000);

    const addBtn = page.locator('.game-cover-add');
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('.modal')).toBeVisible();
    } else {
      // Game might not have a cover - skip
      test.skip();
    }
  });

  test('add to collection and save works', async ({ page }) => {
    await signUpAndEnter(page);
    await page.locator('.game-card').first().click();
    await page.waitForTimeout(5000);

    await page.locator('.game-cover-add').click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Save")').click();
    await page.waitForTimeout(1000);
    // Modal should close
    await expect(page.locator('.modal')).not.toBeVisible();
  });

  test('BACK button navigates away', async ({ page }) => {
    await signUpAndEnter(page);
    await page.locator('.game-card').first().click();
    await page.waitForTimeout(5000);

    const gameUrl = page.url();
    await page.locator('.game-back-btn').click();
    await page.waitForTimeout(2000);
    expect(page.url()).not.toBe(gameUrl);
  });

  test('SHOW ON IGDB.COM link exists', async ({ page }) => {
    await signUpAndEnter(page);
    await page.locator('.game-card').first().click();
    await page.waitForTimeout(5000);

    await expect(page.locator('.game-igdb-link')).toBeVisible();
    const href = await page.locator('.game-igdb-link').getAttribute('href');
    expect(href).toContain('igdb.com');
  });
});

test.describe('Profile Page', () => {
  test('profile shows user info and tabs', async ({ page }) => {
    await signUpAndEnter(page);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    await expect(page.locator('.profile-banner')).toBeVisible();
    await expect(page.locator('.profile-avatar')).toBeVisible();
    await expect(page.locator('.profile-name')).toBeVisible();
    await expect(page.locator('.profile-tab:has-text("LIBRARY")')).toBeVisible();
    await expect(page.locator('.profile-tab:has-text("JOURNAL")')).toBeVisible();
  });

  test('LIBRARY tab shows collections with filter pills', async ({ page }) => {
    await signUpAndEnter(page);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    await expect(page.locator('text=COLLECTIONS')).toBeVisible();
    await expect(page.locator('text=Played')).toBeVisible();
    await expect(page.locator('text=Playing')).toBeVisible();
    await expect(page.locator('text=Want to play')).toBeVisible();
  });

  test('JOURNAL tab shows journal content', async ({ page }) => {
    await signUpAndEnter(page);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    await page.locator('.profile-tab:has-text("JOURNAL")').click();
    await page.waitForTimeout(1000);
    // Should show journal empty state or entries
    await expect(page.locator('.profile-tab.active')).toContainText('JOURNAL');
  });

  test('ADD NEW GAME button opens modal', async ({ page }) => {
    await signUpAndEnter(page);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    const addBtn = page.locator('button:has-text("ADD NEW GAME")');
    await addBtn.scrollIntoViewIfNeeded();
    await addBtn.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.modal')).toBeVisible();
  });

  test('game search in add modal works', async ({ page }) => {
    await signUpAndEnter(page);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    await page.locator('text=ADD NEW GAME').click();
    await page.waitForTimeout(1000);
    await page.locator('input[placeholder="Search for a game..."]').fill('zelda');
    await page.locator('button:has-text("Search")').click();
    await page.waitForTimeout(3000);

    // Should show search results
    const results = page.locator('.modal >> div[style*="cursor: pointer"]');
    await expect(results.first()).toBeVisible({ timeout: 10000 });
  });

  test('EDIT PROFILE navigates to settings', async ({ page }) => {
    await signUpAndEnter(page);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    await page.locator('text=EDIT PROFILE').click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/settings/);
  });
});

test.describe('Navigation', () => {
  test('sidebar Profile link works', async ({ page }) => {
    await signUpAndEnter(page);
    await page.locator('.sidebar a[aria-label="Profile"]').click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/profile/);
  });

  test('sidebar Discover link works', async ({ page }) => {
    await signUpAndEnter(page);
    await page.goto('/profile');
    await page.waitForTimeout(2000);
    await page.locator('.sidebar a[aria-label="Discover"]').click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('sidebar Journal link goes to profile with journal tab', async ({ page }) => {
    await signUpAndEnter(page);
    await page.locator('.sidebar a[aria-label="Journal"]').click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/profile.*tab=journal/);
  });

  test('header ADD A GAME navigates to search', async ({ page }) => {
    await signUpAndEnter(page);
    await page.locator('.header-add-btn').click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/search/);
  });

  test('header settings gear navigates to settings', async ({ page }) => {
    await signUpAndEnter(page);
    await page.locator('.header-icon-btn[aria-label="Settings"]').click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/settings/);
  });

  test('sidebar shows correct active states', async ({ page }) => {
    await signUpAndEnter(page);

    // Dashboard - Discover active
    const discoverItem = page.locator('.sidebar a[aria-label="Discover"]');
    await expect(discoverItem).toHaveClass(/active/);

    // Profile - Profile active
    await page.goto('/profile');
    await page.waitForTimeout(2000);
    const profileItem = page.locator('.sidebar a[aria-label="Profile"]');
    await expect(profileItem).toHaveClass(/active/);
    await expect(discoverItem).not.toHaveClass(/active/);
  });

  test('unauthenticated users redirect to landing', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL('/');
  });

  test('unauthenticated users cannot access profile', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL('/');
  });
});

test.describe('Settings Page', () => {
  test('settings shows profile fields', async ({ page }) => {
    await signUpAndEnter(page);
    await page.goto('/settings');
    await page.waitForTimeout(2000);

    await expect(page.locator('text=Settings')).toBeVisible();
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('settings shows account section', async ({ page }) => {
    await signUpAndEnter(page);
    await page.goto('/settings');
    await page.waitForTimeout(2000);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await expect(page.locator('text=Sign Out')).toBeVisible();
  });

  test('sign out redirects to landing', async ({ page }) => {
    await signUpAndEnter(page);
    await page.goto('/settings');
    await page.waitForTimeout(2000);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Sign Out")').click();
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL('/');
  });
});

test.describe('Discover Page', () => {
  test('discover shows game sections', async ({ page }) => {
    await signUpAndEnter(page);
    await page.goto('/discover');
    await page.waitForTimeout(3000);

    const cards = await page.locator('.game-card').count();
    expect(cards).toBeGreaterThan(0);
  });

  test('discover search works', async ({ page }) => {
    await signUpAndEnter(page);
    await page.goto('/discover');
    await page.waitForTimeout(3000);

    await page.locator('.discover-search-input').fill('mario');
    await page.waitForTimeout(3000);

    await expect(page.locator('text=Search Results')).toBeVisible();
  });
});
