import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

// Logged-in tests: reuse the session saved by `npm run auth:save`
test.use({ storageState: 'auth/user.json' });

test.describe('Facebook home page', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('TC01: feed is displayed and posts are loaded', async () => {
    await expect(homePage.mainContent).toBeVisible();
    await expect(homePage.feedHeading).toBeAttached();
    await homePage.loadPosts(3);

    // Facebook swaps posts that are off screen for placeholders, so don't scroll to each
    // post (it can disappear mid-scroll). Check the posts that are loaded right now.
    await expect.poll(() => homePage.commentButtons.count()).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < 3; i++) {
      await expect(homePage.commentButtons.nth(i)).toBeVisible();
    }
  });

  test('TC02: like 2 random posts', async () => {
    await homePage.loadPosts(3);

    const liked = await homePage.likeRandomPosts(2);
    // Record which posts were picked, so a failed run can be reproduced
    test.info().annotations.push({
      type: 'liked posts',
      description: liked.map((post) => post.label).join(' | '),
    });

    try {
      expect(liked, 'two posts should have been liked').toHaveLength(2);
    } finally {
      // Undo the likes so the account is left as it was
      await homePage.unlikePosts(liked);
    }
  });
});